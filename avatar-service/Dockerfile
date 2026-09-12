FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Downloads and caches the model weights into the image at build time —
# without this, every cold start re-downloads several GB from Hugging Face
# over the network before it can even start loading into memory, on top
# of Cloud Run's own container-boot cold start. One slower build now buys
# every future cold start loading from local disk instead.
#
# variant="fp16" pulls the half-precision checkpoint files (unet 1.73GB,
# text_encoder 681MB, vae 167MB vs 3.46GB/1.36GB/335MB for the fp32 ones —
# roughly half the on-disk weight, ~2.6GB saved) — this is independent of
# torch_dtype, which still upcasts everything to float32 once loaded, so
# compute stays full-precision float32 throughout (CPU support for actual
# fp16 arithmetic is patchy/slow — this avoids ever touching that path).
# Must match app.py's own from_pretrained call exactly, or the runtime
# load looks for files this build never cached and re-downloads them from
# the network on every cold start instead of reading the local image cache.
RUN python -c "from diffusers import AutoPipelineForText2Image; import torch; AutoPipelineForText2Image.from_pretrained('stabilityai/sd-turbo', variant='fp16', torch_dtype=torch.float32)"

# Cloud Run injects the port to listen on via $PORT (defaults to 8080) —
# unlike Hugging Face Spaces' fixed 7860, this has to be read at container
# start, not baked in, so CMD uses a shell form to expand the env var.
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT}
