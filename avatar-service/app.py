"""SD-Turbo avatar generation service, deployed as a Hugging Face Space.

Plain FastAPI rather than Gradio's own auto-generated API: Gradio 5.x's
HTTP contract is a two-step async call-then-poll-over-SSE dance, which
adds real complexity for a contract this app's server has to call
correctly without ever seeing it run live. A single POST endpoint with a
JSON response is simpler to write, call, and reason about — HF Spaces'
Docker SDK runs any container listening on port 7860, not just Gradio
apps, so this deploys the same way.

The model loads once at import time, not per-request, so only the very
first request after the Space wakes from sleep pays the load cost on top
of inference — and since nothing responds until that import finishes, a
plain successful response from GET / already means "awake and ready,"
doubling as both the wake-up trigger and the readiness check.

The Space itself is public on the free tier (private Spaces need a paid
plan), so /generate requires the shared secret set as this Space's
AVATAR_SERVICE_SECRET setting — this isn't billing protection (the free
tier has no usage cost), just keeping the compute for the app that's
actually supposed to be calling it.
"""

import base64
import io
import os

import torch
from diffusers import AutoPipelineForText2Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

MODEL_ID = "stabilityai/sd-turbo"

app = FastAPI()

# Loaded once at startup, not per-request.
pipe = AutoPipelineForText2Image.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
pipe.to("cpu")


class GenerateRequest(BaseModel):
    prompt: str
    secret: str


class GenerateResponse(BaseModel):
    image_base64: str


@app.get("/")
def health() -> dict:
    return {"status": "ready"}


@app.post("/generate", response_model=GenerateResponse)
def generate(body: GenerateRequest) -> GenerateResponse:
    expected = os.environ.get("AVATAR_SERVICE_SECRET")
    if not expected or body.secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    # SD-Turbo is distilled for few-step inference — 1 step is the
    # documented usage, guidance_scale=0 disables classifier-free guidance
    # (which SD-Turbo wasn't trained with and doesn't need).
    image = pipe(
        prompt=body.prompt.strip(),
        num_inference_steps=1,
        guidance_scale=0.0,
    ).images[0]

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return GenerateResponse(image_base64=base64.b64encode(buffer.getvalue()).decode("ascii"))
