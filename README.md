# Movie Tournament Bracket

Settle movie debates NCAA-bracket style: nominate movies (open or draft-style), the
group seeds the bracket, then everyone votes head-to-head each round on a few
categories until a champion is crowned. Project the `/tv` page during a watch party.

## Getting started

```bash
npm install
npx prisma migrate dev
npm run dev
```

Copy `.env.example` to `.env` and fill in:

- `ADMIN_PASSWORD` — shared password that gates `/admin/*` routes.
- `TMDB_API_KEY` — free key from [themoviedb.org](https://www.themoviedb.org/settings/api), used to search movies and fetch posters.

Local dev uses SQLite (`prisma/dev.db`) via `@prisma/adapter-better-sqlite3` — zero
setup required. Production uses Postgres; see [Deploying](#deploying) below.

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

## Testing

```bash
npm run test
```

Unit tests cover the bracket-seeding algorithm (`lib/bracket-generator.ts`, including
bye handling for non-power-of-2 pool sizes) and matchup resolution
(`lib/resolve-matchup.ts`).

## Deploying

1. Push this repo to GitHub and import it in Vercel.
2. In the Vercel project → **Storage**, add a Postgres database (auto-injects
   `DATABASE_URL`).
3. Set `ADMIN_PASSWORD` and `TMDB_API_KEY` as Vercel environment variables.
4. Switch the Prisma datasource to Postgres before deploying — in
   `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`,
   then replace the `@prisma/adapter-better-sqlite3` usage in `lib/db.ts` with
   `@prisma/adapter-pg` (`npm install @prisma/adapter-pg pg`), pointed at
   `process.env.DATABASE_URL`.
5. Deploy — the build script runs `prisma migrate deploy` automatically.
