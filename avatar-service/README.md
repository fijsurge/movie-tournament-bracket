# Avatar generation service

A small FastAPI app that runs [SD-Turbo](https://huggingface.co/stabilityai/sd-turbo)
on CPU and generates a PNG from a text prompt. Deployed separately from
the main app (Vercel can't run this — no persistent containers, no
multi-gigabyte model loading, execution-time limits on serverless
functions) as a free [Hugging Face Space](https://huggingface.co/spaces).

## Deploying (one-time setup)

1. Create a free account at [huggingface.co](https://huggingface.co) if
   you don't have one.
2. Create a new Space: **New Space** → give it a name → **Docker** as the
   SDK → **CPU basic** hardware (free tier) → **Public** visibility (free
   Spaces can't be private).
3. Push this directory's contents to the Space. Two ways to do that:
   - **Git remote** (simplest): the new Space's page shows a git remote
     URL (`https://huggingface.co/spaces/<you>/<space-name>`). From this
     `avatar-service/` directory: `git init`, `git remote add space <url>`,
     commit, `git push space main`.
   - **GitHub sync**: in the Space's settings, connect it to this GitHub
     repo and point it at the `avatar-service/` subdirectory — it'll
     redeploy automatically on push, no separate manual push step.
4. In the Space's **Settings → Variables and secrets**, add a secret named
   `AVATAR_SERVICE_SECRET` — any long random string (e.g.
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   This gates the `/generate` endpoint — the Space is public on the free
   tier, so without this anyone could hit it.
5. Wait for the Space to build and start (first build installs `torch` +
   `diffusers`, which takes a few minutes). Once it shows "Running," note
   its URL — that's `https://<you>-<space-name>.hf.space`.
6. In the main app's environment (Vercel project settings, and your local
   `.env` if you want to test against it), set:
   - `AVATAR_SERVICE_URL` = the Space's URL from step 5
   - `AVATAR_SERVICE_SECRET` = the same value you set in step 4

## What to expect

- **Free-tier Spaces sleep after inactivity.** The first request after a
  quiet spell wakes the container, which re-loads the model before
  responding — this can take a while on top of the generation itself
  (already 10-30+ seconds on CPU). The main app pings this Space's `/` on
  a timer to keep it warm-ish and shows an honest "warming up" status
  rather than a bare spinner — see `app/api/avatar-service/status/route.ts`.
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
