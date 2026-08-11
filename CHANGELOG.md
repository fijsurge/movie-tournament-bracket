# Changelog

## 0.2.0

Email invites, auto-advance, undo, and animation.

- Admin can invite voters by name + email (sent via Gmail SMTP); the emailed
  link identifies them automatically via a per-voter magic-link token, no
  typing their name.
- The bracket now advances phases on its own once every invited voter has
  finished their part (nominated their cap, rated every movie, voted every open
  matchup) — admin only steps in to pause auto-advance or undo the most recently
  completed phase transition if something needs fixing.
- Draft screen and TV projector view (nomination pool, seed leaderboard, bracket
  tree, champion reveal) gained Framer Motion animation: turn-change banners,
  "you're up next," staggered pick/list entries, leaderboard reordering, matchup
  resolve pulses, and a staggered champion reveal.
- Switched from SQLite (local-only) to Postgres everywhere; deployed to Vercel.
- Visual pass: icon system, status badges, voter avatars (presets + photo
  upload), NCAA-style bracket tree with seed badges and connectors, poster-forward
  card styling, shareable links, mobile layout fixes.

## 0.1.0

Initial build: bracket setup (categories, tiebreaker, nomination mode), open and
round-robin-draft nominations with TMDb search, group seeding vote, single-elimination
bracket generation with bye handling, category-based head-to-head voting with
tiebreaker/coin-flip/revote resolution, phase-aware TV projector view, and an about page.
