"""SD-Turbo avatar generation service, deployed to Google Cloud Run.

Plain FastAPI rather than a wrapping framework (Gradio, etc.): a single
POST endpoint with a JSON response is simple to write, call, and reason
about — this app's server has to call it correctly without ever seeing it
run live.

The model loads in a background thread kicked off at startup, not
synchronously at import time — Cloud Run's own startup health check
requires the container to bind its port within a timeout window, and
loading a multi-gigabyte model can take longer than that. Blocking at
import time means the port never opens in time and the deployment fails
outright, not just slowly — this isn't a slow-first-request trade-off,
it's a hard failure. Loading in the background lets uvicorn bind
immediately; GET / reports the true "loading" vs "ready" state in its
response body so the caller (app/api/avatar-service/status/route.ts)
still gets an accurate readiness signal, just via the body instead of the
raw HTTP status. /generate still blocks on the model actually being ready
if it's called before loading finishes, so it's always correct, just
occasionally slow right after a cold start.

The service is reachable at a public Cloud Run URL (--allow-unauthenticated
was needed since Cloud Run's own IAM invoker auth is separate from this
app's own gating), so /generate requires the shared secret set as this
service's AVATAR_SERVICE_SECRET env var — this isn't billing protection,
just keeping the compute for the app that's actually supposed to call it.
"""

import base64
import io
import os
import threading
import time

import torch
from diffusers import AutoPipelineForText2Image
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

MODEL_ID = "stabilityai/sd-turbo"

app = FastAPI()

pipe = None
pipe_lock = threading.Lock()


def load_model() -> None:
    global pipe
    with pipe_lock:
        if pipe is None:
            loaded = AutoPipelineForText2Image.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
            loaded.to("cpu")
            pipe = loaded


@app.on_event("startup")
def start_loading_model() -> None:
    threading.Thread(target=load_model, daemon=True).start()


# SD-Turbo requires dimensions divisible by 8 — fixed, known-good sizes
# rather than trusting arbitrary pixel dimensions from the caller.
ASPECT_SIZES = {
    "square": (512, 512),
    "portrait": (512, 768),
}


class GenerateRequest(BaseModel):
    prompt: str
    secret: str
    aspect: str = "square"


class GenerateResponse(BaseModel):
    image_base64: str


@app.get("/")
def health() -> dict:
    return {"status": "ready" if pipe is not None else "loading"}


# How often a request queued behind the lock re-checks whether it should
# give up, rather than sitting blocked for however long the ones ahead of
# it take.
QUEUE_POLL_INTERVAL = 2.0

# The longest a request will wait in queue before giving up on its own.
# app/api/avatar-service/generate/route.ts never waits longer than 150s
# for a single attempt (AbortSignal.timeout) — a request still queued
# well past that is essentially guaranteed to have already been abandoned
# by its caller, whether or not Cloud Run's proxy has actually surfaced
# that disconnect to this container yet (observed live: it often hasn't,
# even 200+ seconds after the client gave up — request.is_disconnected()
# alone isn't reliable enough here to depend on). Kept comfortably under
# that 150s ceiling so this always fires first.
MAX_QUEUE_WAIT_SECONDS = 140.0


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: Request, body: GenerateRequest) -> GenerateResponse:
    expected = os.environ.get("AVATAR_SERVICE_SECRET")
    if not expected or body.secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")
    if await request.is_disconnected():
        raise HTTPException(status_code=408, detail="Client disconnected")

    width, height = ASPECT_SIZES.get(body.aspect, ASPECT_SIZES["square"])

    # Blocks here if a request lands before the background load finishes
    # (e.g. right after a cold start) — always correct, just occasionally
    # slower than the common case where it's already loaded.
    if pipe is None:
        await run_in_threadpool(load_model)

    # The pipe's scheduler carries mutable state (sigmas, step_index) across
    # a call — two requests running inference concurrently on the same
    # instance corrupt each other's state (observed live as an unrelated
    # IndexError deep in diffusers' scheduler), so only one request may
    # hold the pipe at a time.
    #
    # A client-side abort/retry doesn't stop an abandoned request from
    # still sitting here waiting its turn — observed live as a cluster of
    # requests each running the full 300s to Cloud Run's own timeout,
    # queued behind each other with no way to notice their own caller had
    # already given up. Polling with a timeout instead of blocking on the
    # lock outright, and enforcing MAX_QUEUE_WAIT_SECONDS as a hard ceiling
    # on top of the (unreliable, but free) is_disconnected() check, lets a
    # stale request exit well before it would otherwise burn a full 300s
    # doing nothing useful.
    queued_since = time.monotonic()
    while not await run_in_threadpool(pipe_lock.acquire, timeout=QUEUE_POLL_INTERVAL):
        if await request.is_disconnected():
            raise HTTPException(status_code=408, detail="Client disconnected while waiting")
        if time.monotonic() - queued_since > MAX_QUEUE_WAIT_SECONDS:
            raise HTTPException(status_code=408, detail="Timed out waiting for the generator")
    try:
        if await request.is_disconnected():
            raise HTTPException(status_code=408, detail="Client disconnected while waiting")

        def run_inference():
            # SD-Turbo is distilled for few-step inference — 1 step is the
            # documented usage, guidance_scale=0 disables classifier-free
            # guidance (which SD-Turbo wasn't trained with and doesn't need).
            return pipe(
                prompt=body.prompt.strip(),
                num_inference_steps=1,
                guidance_scale=0.0,
                width=width,
                height=height,
            ).images[0]

        image = await run_in_threadpool(run_inference)
    finally:
        pipe_lock.release()

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return GenerateResponse(image_base64=base64.b64encode(buffer.getvalue()).decode("ascii"))
