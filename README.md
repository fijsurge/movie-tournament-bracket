# Movie Tournament Bracket

Settle movie debates NCAA-bracket style: nominate movies (open or draft-style), the
group seeds the bracket, then everyone votes head-to-head each round on a few
categories until a champion is crowned. Project the `/tv` page during a watch party.

## Getting started

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — a Postgres connection string. A free
  [Neon](https://neon.tech) or Vercel Postgres branch works well for local dev.
- `ADMIN_PASSWORD` — shared password that gates `/admin/*` routes.
- `TMDB_API_KEY` — free key from [themoviedb.org](https://www.themoviedb.org/settings/api), used to search movies and fetch posters.
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — used to email bracket invites, sent from your own Gmail account over SMTP. Turn on 2-Step Verification on the Google account, then generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — use that (not your regular password) as `GMAIL_APP_PASSWORD`.

The app uses Postgres everywhere (via `@prisma/adapter-pg`) — the same connection
string works for local dev and production, so there's no separate local database
setup beyond pointing `DATABASE_URL` at a real instance.

> **Windows + non-NTFS drives:** both Turbopack and webpack call `fs.readlink` during
> the build in ways exFAT/FAT32 don't support correctly, so `next build` fails on
> those drives (dev mode is unaffected — `npm run dev` already passes `--webpack` to
> work around Turbopack's separate junction-point issue). `npm run build` itself is
> fine; it just needs to run on NTFS (any normal Vercel/Linux/macOS/CI environment
> works — this only bites local builds on an exFAT-formatted Windows drive).

## How it works

1. **Setup** — admin creates a bracket, configures scoring categories (one flagged as
   the tiebreaker), and picks a nomination mode (open or round-robin draft).
2. **Nominate** — the group builds the movie pool.
3. **Seed** — everyone rates each movie 1-5; the average sets seed order.
4. **Vote** — head-to-head rounds, scored per category. Ties fall back to the
   tiebreaker category, then an admin coin flip or revote.
5. **TV view** (`/b/[slug]/tv`) — phase-aware projector screen: nomination pool/draft
   board → seeding leaderboard → bracket tree → champion reveal.

### Email invites & auto-advance

From the admin dashboard, invite people by name + email — they get a link that
identifies them automatically (no typing their name). Once every invited voter has
finished the current phase (nominated their cap, rated every movie, voted every
open matchup), the bracket advances on its own — no admin clicks required.
Voters who join the old way (typing their name on the public link) still work
exactly as before; they just don't count toward auto-advance, since the app has
no way to know when an open-ended crowd is "done."

The admin can pause auto-advance at any time (toggle on the dashboard) and fall
back to the manual "close X" buttons, or use **Undo last phase** to reverse the
most recently completed transition if something needs fixing — reopening it also
pauses auto-advance so the same condition doesn't immediately re-trigger it.

## Testing

```bash
npm run test
```

Unit tests cover the bracket-seeding algorithm (`lib/bracket-generator.ts`, including
bye handling for non-power-of-2 pool sizes), matchup resolution
(`lib/resolve-matchup.ts`), and auto-advance completion checks (`lib/phase-completion.ts`).

## Deploying

1. Push this repo to GitHub and import it in Vercel.
2. In the Vercel project → **Storage**, add a Postgres database (auto-injects
   `DATABASE_URL`).
3. Set `ADMIN_PASSWORD`, `TMDB_API_KEY`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` as Vercel environment variables.
4. Deploy — the build script runs `prisma migrate deploy` automatically.
