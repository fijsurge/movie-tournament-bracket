FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Cloud Run injects the port to listen on via $PORT (defaults to 8080) —
# unlike Hugging Face Spaces' fixed 7860, this has to be read at container
# start, not baked in, so CMD uses a shell form to expand the env var.
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT}
