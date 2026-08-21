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
RUN python -c "from diffusers import AutoPipelineForText2Image; import torch; AutoPipelineForText2Image.from_pretrained('stabilityai/sd-turbo', torch_dtype=torch.float32)"

# Cloud Run injects the port to listen on via $PORT (defaults to 8080) —
# unlike Hugging Face Spaces' fixed 7860, this has to be read at container
# start, not baked in, so CMD uses a shell form to expand the env var.
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT}
