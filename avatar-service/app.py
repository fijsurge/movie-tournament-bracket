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

import torch
from diffusers import AutoPipelineForText2Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

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


@app.post("/generate", response_model=GenerateResponse)
def generate(body: GenerateRequest) -> GenerateResponse:
    expected = os.environ.get("AVATAR_SERVICE_SECRET")
    if not expected or body.secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    width, height = ASPECT_SIZES.get(body.aspect, ASPECT_SIZES["square"])

    # Blocks here if a request lands before the background load finishes
    # (e.g. right after a cold start) — always correct, just occasionally
    # slower than the common case where it's already loaded.
    if pipe is None:
        load_model()

    # The pipe's scheduler carries mutable state (sigmas, step_index) across
    # a call — two requests running inference concurrently on the same
    # instance corrupt each other's state (observed live as an unrelated
    # IndexError deep in diffusers' scheduler). A client-side abort/retry
    # doesn't stop the abandoned request from still running here, so this
    # lock is the only thing making that safe: a second request just waits
    # its turn instead of racing the first. Reusing pipe_lock rather than a
    # separate lock keeps "the shared pipe" guarded by exactly one lock for
    # its whole lifecycle, load included.
    with pipe_lock:
        # SD-Turbo is distilled for few-step inference — 1 step is the
        # documented usage, guidance_scale=0 disables classifier-free
        # guidance (which SD-Turbo wasn't trained with and doesn't need).
        image = pipe(
            prompt=body.prompt.strip(),
            num_inference_steps=1,
            guidance_scale=0.0,
            width=width,
            height=height,
        ).images[0]

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return GenerateResponse(image_base64=base64.b64encode(buffer.getvalue()).decode("ascii"))
