"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { submitVote } from "@/app/b/[slug]/vote/actions";
import { Spinner } from "@/components/shared/Spinner";
import { PosterButton } from "@/components/shared/PosterButton";
import { SwipeMatchupCard } from "@/components/voting/SwipeMatchupCard";
import { swipeToScores } from "@/lib/swipe-vote";

interface Category {
  key: string;
  label: string;
}

interface MovieInfo {
  id: string;
  title: string;
  posterUrl: string | null;
  overview: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  runtime: number | null;
  trailerKey: string | null;
}

const SCORES = [1, 2, 3, 4, 5];

function ScorePicker({
  title,
  categories,
  scores,
  setScores,
  divider,
}: {
  title: string;
  categories: Category[];
  scores: Record<string, number>;
  setScores: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-2 ${divider ? "border-t border-gold/15 pt-4 sm:border-t-0 sm:pt-0" : ""}`}
    >
      <p className="truncate text-sm font-semibold text-gold">{title}</p>
      {categories.map((cat) => (
        <div key={cat.key} className="flex flex-col gap-1">
          <span className="text-sm">{cat.label}</span>
          <div className="flex gap-1.5">
            {SCORES.map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setScores((prev) => ({ ...prev, [cat.key]: score }))}
                aria-pressed={scores[cat.key] === score}
                className={`h-11 w-11 shrink-0 rounded border text-xs transition active:scale-95 ${
                  scores[cat.key] === score
                    ? "border-gold bg-gold text-ink"
                    : "border-gold/25 text-cream hover:border-gold/50 active:border-gold/50"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-cream-dim">
        Total: {categories.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0)}
      </p>
    </div>
  );
}

export function VoteForm({
  matchupId,
  categories,
  movieA,
  movieB,
  initialScoresA,
  initialScoresB,
  baselineScoresA,
  baselineScoresB,
  onSubmitted,
}: {
  matchupId: string;
  categories: Category[];
  movieA: MovieInfo;
  movieB: MovieInfo;
  initialScoresA?: Record<string, number>;
  initialScoresB?: Record<string, number>;
  // Pre-fills a not-yet-voted matchup from the voter's last deliberately
  // rated matchup (never a swipe-only one — see viaSwipeOnly), so their
  // usual category weighting carries forward instead of starting blank.
  // Ignored once initialScoresA is set — that always wins as the real vote.
  baselineScoresA?: Record<string, number>;
  baselineScoresB?: Record<string, number>;
  onSubmitted?: () => void;
}) {
  const [scoresA, setScoresA] = useState<Record<string, number>>(initialScoresA ?? baselineScoresA ?? {});
  const [scoresB, setScoresB] = useState<Record<string, number>>(initialScoresB ?? baselineScoresB ?? {});
  const [submitted, setSubmitted] = useState(Boolean(initialScoresA));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [swiped, setSwiped] = useState(false);
  const [swipedWinnerTitle, setSwipedWinnerTitle] = useState<string | null>(null);
  // Flips true the moment the voter touches an individual score button —
  // distinguishes "swiped, then actually adjusted something" from "swiped
  // and hit submit as-is", so only the latter gets flagged viaSwipeOnly and
  // excluded from becoming a future matchup's baseline.
  const [manuallyEdited, setManuallyEdited] = useState(false);
  // Only ever set true as a direct result of a swipe — manual-only voting
  // and re-opening an already-voted matchup never touch this, so the grid
  // stays exactly as expanded as it's always been for both of those cases.
  const [scoresCollapsed, setScoresCollapsed] = useState(false);

  const complete =
    categories.every((c) => scoresA[c.key] !== undefined) &&
    categories.every((c) => scoresB[c.key] !== undefined);
  const totalA = categories.reduce((sum, c) => sum + (scoresA[c.key] ?? 0), 0);
  const totalB = categories.reduce((sum, c) => sum + (scoresB[c.key] ?? 0), 0);

  // Only offered on a matchup the voter hasn't scored yet — prevents an
  // accidental re-swipe from silently overwriting a considered vote. Once
  // swiped this session, the card gives way to the static header + a
  // confirmation line instead of leaving its own reserved space behind.
  const showSwipeCard = !initialScoresA && !swiped;
  const showBaselineHint = !initialScoresA && !swiped && Boolean(baselineScoresA);

  function editScoresA(fn: (prev: Record<string, number>) => Record<string, number>) {
    setManuallyEdited(true);
    setScoresA(fn);
  }
  function editScoresB(fn: (prev: Record<string, number>) => Record<string, number>) {
    setManuallyEdited(true);
    setScoresB(fn);
  }

  function handleSwipe(winner: "A" | "B") {
    const { scoresA: a, scoresB: b } = swipeToScores(
      categories.map((c) => c.key),
      winner,
    );
    setScoresA(a);
    setScoresB(b);
    setSwiped(true);
    setSwipedWinnerTitle(winner === "A" ? movieA.title : movieB.title);
    setScoresCollapsed(true);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitVote({
        matchupId,
        scoresMovieA: scoresA,
        scoresMovieB: scoresB,
        viaSwipeOnly: swiped && !manuallyEdited,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        onSubmitted?.();
      }
    });
  }

  return (
    <div className="rounded-xl bg-surface p-4 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.75)]">
      {!showSwipeCard && (
        <div className="mb-4 flex items-start justify-center gap-4 text-center">
          <div className="flex w-[84px] shrink-0 flex-col items-center gap-2">
            {movieA.posterUrl && (
              <PosterButton
                movie={movieA}
                width={84}
                height={126}
                imageClassName="rounded-md shadow-[0_10px_22px_-8px_rgba(0,0,0,0.8)]"
              />
            )}
            <span className="text-sm font-medium break-words">{movieA.title}</span>
          </div>
          <span className="font-display text-rose">vs</span>
          <div className="flex w-[84px] shrink-0 flex-col items-center gap-2">
            {movieB.posterUrl && (
              <PosterButton
                movie={movieB}
                width={84}
                height={126}
                imageClassName="rounded-md shadow-[0_10px_22px_-8px_rgba(0,0,0,0.8)]"
              />
            )}
            <span className="text-sm font-medium break-words">{movieB.title}</span>
          </div>
        </div>
      )}

      {swiped && swipedWinnerTitle && (
        <p className="mb-4 text-center text-sm text-cream-dim">
          You picked <span className="font-medium text-gold">{swipedWinnerTitle}</span> — adjust the scores
          below if you&apos;d like.
        </p>
      )}

      {showBaselineHint && (
        <p className="mb-4 text-center text-sm text-cream-dim">
          Pre-filled with your usual ratings — adjust below if this one&apos;s different.
        </p>
      )}

      {showSwipeCard && (
        <SwipeMatchupCard
          movieA={{ title: movieA.title, posterUrl: movieA.posterUrl }}
          movieB={{ title: movieB.title, posterUrl: movieB.posterUrl }}
          onSwipe={handleSwipe}
        />
      )}

      <AnimatePresence mode="wait" initial={false}>
        {scoresCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-3 rounded-lg border border-gold/15 bg-ink/40 p-3"
          >
            <div className="flex gap-4 text-sm">
              <span className="truncate">
                {movieA.title}: <span className="font-medium text-gold">{totalA}</span>
              </span>
              <span className="truncate">
                {movieB.title}: <span className="font-medium text-gold">{totalB}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setScoresCollapsed(false)}
              aria-expanded={false}
              className="shrink-0 text-sm text-gold underline underline-offset-2"
            >
              Adjust scores
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
          >
            <ScorePicker title={movieA.title} categories={categories} scores={scoresA} setScores={editScoresA} />
            <ScorePicker
              title={movieB.title}
              categories={categories}
              scores={scoresB}
              setScores={editScoresB}
              divider
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!complete || pending}
        className="mt-4 w-full rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" /> Submitting…
          </span>
        ) : submitted ? (
          "Update vote"
        ) : (
          "Submit vote"
        )}
      </button>
      {submitted && <p className="mt-1 text-center text-xs text-cream-dim">Vote recorded — you can change it until the round closes.</p>}
    </div>
  );
}
