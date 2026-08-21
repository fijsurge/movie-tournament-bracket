"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChampionBanner } from "@/components/bracket/ChampionBanner";
import { SeedLeaderboard } from "@/components/seed/SeedLeaderboard";
import { BracketTree } from "@/components/bracket/BracketTree";
import { NominationPool } from "@/components/nominate/NominationPool";
import { PickAnnouncement } from "@/components/shared/PickAnnouncement";
import { PickRevealOverlay } from "@/components/bracket/PickRevealOverlay";
import { RoundTransitionOverlay } from "@/components/bracket/RoundTransitionOverlay";
import { SwipeMatchupCard } from "@/components/voting/SwipeMatchupCard";
import type { BracketState, BracketStateMovie, BracketStateRound } from "@/types/bracket";

const POSTERS = [
  "https://image.tmdb.org/t/p/w342/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg", // Top Gun: Maverick
  "https://image.tmdb.org/t/p/w342/l5uxY5m5OInWpcExIpKG6AR3rgL.jpg", // Mission: Impossible
  "https://image.tmdb.org/t/p/w342/lABvGN7fDk5ifnwZoxij6G96t2w.jpg", // Jerry Maguire
];

const MOCK_TITLES = [
  "Top Gun: Maverick",
  "Mission: Impossible",
  "Jerry Maguire",
  "A Few Good Men",
  "Rain Man",
  "Magnolia",
  "Collateral",
  "Edge of Tomorrow",
];

const AVATARS = ["🎬", "🍿", "🥂", "🏆"];
const VOTER_NAMES = ["You", "Jordan", "Sam"];

// Rick Astley's "Never Gonna Give You Up" — a permanently-stable, always-
// embeddable YouTube id, used as a stand-in trailer so the trailer sections
// below are actually previewable without depending on a real movie trailer
// staying up.
const MOCK_TRAILER_KEY = "dQw4w9WgXcQ";

function makeMovie(index: number): BracketStateMovie {
  return {
    id: `movie-${index}`,
    tmdbId: 1000 + index,
    title: MOCK_TITLES[index % MOCK_TITLES.length],
    posterUrl: POSTERS[index % POSTERS.length],
    overview:
      "A group of friends and rivals face off in a high-stakes tournament where only one movie can be crowned champion.",
    voteAverage: 7.2,
    releaseYear: 2020 + (index % 5),
    runtime: 110 + index,
    trailerKey: index % 2 === 0 ? MOCK_TRAILER_KEY : null,
    filmTitle: null,
    filmYear: null,
    nominatedByName: VOTER_NAMES[index % VOTER_NAMES.length],
    nominatedByAvatar: AVATARS[index % AVATARS.length],
    seed: null,
    seedVoteCount: 0,
    seedVoteAverage: null,
  };
}

function makeMovies(count: number, withScores = false): BracketStateMovie[] {
  return Array.from({ length: count }, (_, i) => ({
    ...makeMovie(i),
    seedVoteAverage: withScores ? Math.round((Math.random() * 3 + 2) * 10) / 10 : null,
    seedVoteCount: withScores ? 3 : 0,
  }));
}

function makeBracketState(movies: BracketStateMovie[]): BracketState {
  return {
    bracket: {
      id: "demo",
      slug: "demo",
      name: "Demo Bracket",
      status: "NOMINATING",
      nominationMode: "OPEN",
      contentType: "MOVIE",
      characterName: null,
      nominationCapPerVoter: MOCK_TITLES.length,
      poolTargetSize: null,
      hasFilters: false,
      filterSummary: null,
      invitedVoterCount: VOTER_NAMES.length,
    },
    categories: [],
    movies,
    voterNames: VOTER_NAMES,
    draft: null,
    leaderboard: null,
    rounds: [],
  };
}

function makeBracket(): BracketStateRound[] {
  const m = makeMovies(4);
  return [
    {
      roundNumber: 1,
      status: "VOTING_OPEN",
      closesAt: null,
      confirmedVoterIds: [],
      matchups: [
        {
          id: "m1",
          position: 0,
          isBye: false,
          status: "OPEN",
          movieA: { id: m[0].id, title: m[0].title, posterUrl: m[0].posterUrl, seed: 1, trailerKey: m[0].trailerKey },
          movieB: { id: m[1].id, title: m[1].title, posterUrl: m[1].posterUrl, seed: 4, trailerKey: m[1].trailerKey },
          winnerMovieId: null,
          winnerTitle: null,
        },
        {
          id: "m2",
          position: 1,
          isBye: false,
          status: "OPEN",
          movieA: { id: m[2].id, title: m[2].title, posterUrl: m[2].posterUrl, seed: 2, trailerKey: m[2].trailerKey },
          movieB: { id: m[3].id, title: m[3].title, posterUrl: m[3].posterUrl, seed: 3, trailerKey: m[3].trailerKey },
          winnerMovieId: null,
          winnerTitle: null,
        },
      ],
    },
    {
      roundNumber: 2,
      status: "PENDING",
      closesAt: null,
      confirmedVoterIds: [],
      matchups: [
        { id: "m3", position: 0, isBye: false, status: "PENDING", movieA: null, movieB: null, winnerMovieId: null, winnerTitle: null },
      ],
    },
  ];
}

function resolveNextMatchup(rounds: BracketStateRound[]): BracketStateRound[] {
  const next = structuredClone(rounds);
  const openMatchup = next[0].matchups.find((m) => m.status === "OPEN");
  if (openMatchup?.movieA) {
    openMatchup.status = "RESOLVED";
    openMatchup.winnerMovieId = openMatchup.movieA.id;
    openMatchup.winnerTitle = openMatchup.movieA.title;
    const final = next[1].matchups[0];
    const slot = {
      id: openMatchup.movieA.id,
      title: openMatchup.movieA.title,
      posterUrl: openMatchup.movieA.posterUrl,
      seed: openMatchup.movieA.seed,
      trailerKey: openMatchup.movieA.trailerKey,
    };
    if (openMatchup.position === 0) final.movieA = slot;
    else final.movieB = slot;
  }
  return next;
}

function advanceRound(rounds: BracketStateRound[]): BracketStateRound[] {
  const next = structuredClone(rounds);
  const openIndex = next.findIndex((r) => r.status === "VOTING_OPEN");
  if (openIndex === -1 || openIndex + 1 >= next.length) return next;
  next[openIndex].status = "COMPLETE";
  next[openIndex + 1].status = "VOTING_OPEN";
  return next;
}

const BUTTON = "rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50";
const OUTLINE_BUTTON = "rounded-full border border-gold/40 px-4 py-2 text-sm text-cream transition hover:border-gold active:scale-95";
const SECTION = "rounded-xl border border-gold/15 bg-surface p-6";

function TriggerForm({ onTrigger, children, disabled }: { onTrigger: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className="mt-4 flex gap-2">
      <button type="button" onClick={onTrigger} disabled={disabled} className={BUTTON}>
        {children}
      </button>
    </div>
  );
}

export default function AnimationsPreviewPage() {
  const [turnIndex, setTurnIndex] = useState(0);
  const currentVoter = VOTER_NAMES[turnIndex];
  const nextVoter = VOTER_NAMES[(turnIndex + 1) % VOTER_NAMES.length];
  const isMyTurn = currentVoter === "You";
  const isUpNext = !isMyTurn && nextVoter === "You";

  const [draftPool, setDraftPool] = useState<BracketStateMovie[]>(() => makeMovies(1));
  const [pool, setPool] = useState<BracketStateMovie[]>(() => makeMovies(3));
  const [scores, setScores] = useState<BracketStateMovie[]>(() => makeMovies(5, true));
  const [rounds, setRounds] = useState<BracketStateRound[]>(() => makeBracket());
  const [championKey, setChampionKey] = useState(0);
  const [overlayRounds, setOverlayRounds] = useState<BracketStateRound[]>(() => makeBracket());
  const [swipeKey, setSwipeKey] = useState(0);
  const [swipeResult, setSwipeResult] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-ink p-6 text-cream">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-24">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-gold uppercase">Animation preview</h1>
          <p className="mt-1 text-sm text-cream-dim">
            The real components rendering with mock data — not linked from anywhere in the app, just for
            previewing what shipped. Click each trigger to replay.
          </p>
        </div>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">Draft turn banner</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVoter}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={`rounded-lg border p-3 text-center ${
                isMyTurn
                  ? "animate-pulse border-gold bg-gold/10 shadow-[0_0_30px_-6px_rgba(232,163,61,0.5)]"
                  : "border-gold/20 bg-surface-raised"
              }`}
            >
              {isMyTurn ? (
                <p className="font-display text-lg tracking-wide text-gold uppercase">It&apos;s your turn — pick a movie!</p>
              ) : (
                <p>
                  Waiting on <span className="font-medium text-gold">{currentVoter}</span>…
                </p>
              )}
            </motion.div>
          </AnimatePresence>
          {isUpNext && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-sm text-cream-dim">
              🎬 You&apos;re up next — get ready!
            </motion.p>
          )}
          <div className="mt-2">
            <PickAnnouncement movies={draftPool} />
          </div>
          <TriggerForm onTrigger={() => setTurnIndex((i) => (i + 1) % VOTER_NAMES.length)}>Next turn →</TriggerForm>
          <TriggerForm
            onTrigger={() =>
              setDraftPool((prev) => (prev.length >= MOCK_TITLES.length ? prev : [...prev, makeMovie(prev.length)]))
            }
            disabled={draftPool.length >= MOCK_TITLES.length}
          >
            Make a pick
          </TriggerForm>
        </section>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">
            Nomination pool + pick reveal (TV view)
          </h2>
          <p className="text-sm text-cream-dim">
            On the real TV both come from the same live data, so adding a pick below also triggers the full-screen
            takeover — fixed full-screen, so it&apos;ll cover the whole page for a few seconds.
          </p>
          <PickRevealOverlay movies={pool} soundEnabled={false} />
          <div className="rounded-lg bg-ink">
            <NominationPool state={makeBracketState(pool)} />
          </div>
          <TriggerForm
            onTrigger={() => setPool((prev) => (prev.length >= MOCK_TITLES.length ? prev : [...prev, makeMovie(prev.length)]))}
            disabled={pool.length >= MOCK_TITLES.length}
          >
            + Add a pick
          </TriggerForm>
        </section>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">Seed leaderboard reordering</h2>
          <div className="rounded-lg bg-ink">
            <SeedLeaderboard movies={scores} voterCount={4} />
          </div>
          <TriggerForm
            onTrigger={() =>
              setScores((prev) => prev.map((m) => ({ ...m, seedVoteAverage: Math.round((Math.random() * 3 + 2) * 10) / 10 })))
            }
          >
            Shuffle scores
          </TriggerForm>
        </section>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">Bracket tree resolve + propagate</h2>
          <div className="rounded-lg bg-ink">
            <BracketTree rounds={rounds} />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setRounds((prev) => resolveNextMatchup(prev))} className={BUTTON}>
              Resolve next matchup
            </button>
            <button type="button" onClick={() => setRounds(makeBracket())} className={OUTLINE_BUTTON}>
              Reset
            </button>
          </div>
        </section>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">
            Round transition (TV full-screen takeover)
          </h2>
          <p className="text-sm text-cream-dim">Also fixed full-screen — same caveat as above.</p>
          <RoundTransitionOverlay rounds={overlayRounds} soundEnabled={false} />
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setOverlayRounds((prev) => advanceRound(prev))} className={BUTTON}>
              Advance round
            </button>
            <button type="button" onClick={() => setOverlayRounds(makeBracket())} className={OUTLINE_BUTTON}>
              Reset
            </button>
          </div>
        </section>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">Champion reveal</h2>
          <div className="min-h-[520px] rounded-lg bg-ink">
            <ChampionBanner
              key={championKey}
              bracketName="Movie Madness Bracket"
              championTitle="Top Gun: Maverick"
              posterUrl={POSTERS[0]}
              trailerKey={MOCK_TRAILER_KEY}
              soundEnabled={false}
              leaderboard={[
                { voterId: "you", voterName: "You", voterAvatar: null, points: 14 },
                { voterId: "jordan", voterName: "Jordan", voterAvatar: null, points: 9 },
              ]}
            />
          </div>
          <TriggerForm onTrigger={() => setChampionKey((k) => k + 1)}>Replay reveal</TriggerForm>
        </section>

        <section className={SECTION}>
          <h2 className="mb-3 font-display text-lg tracking-wide text-rose uppercase">Swipe-to-vote card</h2>
          <p className="text-sm text-cream-dim">
            Try this on a real phone — drag the card left or right past the threshold to commit, or let go early
            to spring back. This is the one piece of the mobile UI work that can&apos;t be verified any other way.
          </p>
          <div className="rounded-lg bg-ink">
            <SwipeMatchupCard
              key={swipeKey}
              movieA={{ title: MOCK_TITLES[0], posterUrl: POSTERS[0] }}
              movieB={{ title: MOCK_TITLES[1], posterUrl: POSTERS[1] }}
              onSwipe={(winner) => setSwipeResult(winner === "A" ? MOCK_TITLES[0] : MOCK_TITLES[1])}
            />
          </div>
          {swipeResult && <p className="mt-2 text-center text-sm text-gold">Swiped for: {swipeResult}</p>}
          <TriggerForm
            onTrigger={() => {
              setSwipeKey((k) => k + 1);
              setSwipeResult(null);
            }}
          >
            Reset card
          </TriggerForm>
        </section>
      </div>
    </main>
  );
}
