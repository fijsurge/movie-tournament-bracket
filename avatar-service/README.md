# Avatar generation service

A small FastAPI app that runs [SD-Turbo](https://huggingface.co/stabilityai/sd-turbo)
on CPU and generates a PNG from a text prompt. Deployed separately from
the main app (Vercel can't run this — no persistent containers, no
multi-gigabyte model loading, execution-time limits on serverless
functions) to **Google Cloud Run's Always Free tier**.

(Hugging Face Spaces was the original plan, but both its Docker and
Gradio SDKs are gated behind a paid plan now — only Static Spaces, which
have no backend at all, are free. Cloud Run runs this exact Dockerfile
unchanged, which Spaces couldn't anymore.)

## Deploying (one-time setup)

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
   (or reuse one you already have) and note its **Project ID**.
2. **Billing has to be linked to the project even for free-tier usage** —
   Google requires a card on file for verification. Usage here should stay
   within the Always Free tier (2 million requests, 360,000 GiB-seconds of
   memory, and 180,000 vCPU-seconds per month — occasional avatar
   generation for a small group doesn't come close), but as a safety net:
   **Billing → Budgets & alerts → create a $1 budget alert**, so you'd
   hear about it immediately if anything ever did accrue cost, rather than
   finding out later.
3. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install),
   then `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`.
4. Generate a secret for `AVATAR_SERVICE_SECRET` — any long random string
   (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   This gates `/generate` — Cloud Run services are invoked over a public
   URL by default, so without this anyone with the URL could hit it.
5. From this `avatar-service/` directory, deploy directly from source —
   Cloud Build reads the Dockerfile and builds it for you, no separate
   registry push step needed:
   ```bash
   gcloud run deploy avatar-service \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 4Gi \
     --cpu 2 \
     --timeout 300 \
     --min-instances 0 \
     --max-instances 1 \
     --set-env-vars AVATAR_SERVICE_SECRET=your-secret-here
   ```
   - `--allow-unauthenticated`: Cloud Run's own IAM-based invoker auth is
     separate from `AVATAR_SERVICE_SECRET` — this makes the URL publicly
     reachable so our own app-level secret check (not GCP's) is what
     actually gates it.
   - `--memory 4Gi --cpu 2`: SD-Turbo + torch + diffusers needs real RAM;
     Cloud Run's 512Mi default isn't enough. Adjust if generation is too
     slow or the container gets OOM-killed.
   - `--min-instances 0`: scales to zero when idle — no cost while
     nobody's generating avatars, at the cost of a cold start (container
     boot + model load) on the next request after a quiet spell. This is
     exactly what `app/api/avatar-service/status/route.ts`'s "warming up"
     status is designed around.
   - `--max-instances 1`: caps concurrency as an extra guard against
     unexpected scaling/cost for a small app with low, bursty traffic.
6. The deploy command prints a **Service URL** when it finishes — that's
   `AVATAR_SERVICE_URL`. In the main app's environment (Vercel project
   settings, and your local `.env` if you want to test against it), set:
   - `AVATAR_SERVICE_URL` = that Service URL
   - `AVATAR_SERVICE_SECRET` = the same value from step 4

## What to expect

- **Scaled to zero, every request after a quiet spell is a cold start.**
  Unlike a sleep/wake model that might stay warm through a whole session,
  `--min-instances 0` means Cloud Run can spin the container down between
  any two requests that aren't close together — cold start (container
  boot + model load) plus the generation itself (10-30+ seconds on CPU).
  The main app pings this service's `/` the moment the generate panel
  opens, before the voter's finished picking presets, to get a head start.
- **Licensing**: SD-Turbo ships under Stability AI's community license —
  free for non-commercial/small-scale use, not a fully permissive OSI
  license. Fine for this hobby project; worth knowing if this ever grows
  beyond that.

## API

`GET /` — health check. Any successful response means the model is loaded
and ready (nothing responds until the module-level model load finishes).

`POST /generate` — body `{"prompt": string, "secret": string}`, returns
`{"image_base64": string}` (a PNG, base64-encoded, no data: prefix) on
success. `401` if the secret doesn't match `AVATAR_SERVICE_SECRET`, `400`
if the prompt is empty.
