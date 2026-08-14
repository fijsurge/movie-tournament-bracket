"use client";

import { useState, useTransition } from "react";
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
  onSubmitted,
}: {
  matchupId: string;
  categories: Category[];
  movieA: MovieInfo;
  movieB: MovieInfo;
  initialScoresA?: Record<string, number>;
  initialScoresB?: Record<string, number>;
  onSubmitted?: () => void;
}) {
  const [scoresA, setScoresA] = useState<Record<string, number>>(initialScoresA ?? {});
  const [scoresB, setScoresB] = useState<Record<string, number>>(initialScoresB ?? {});
  const [submitted, setSubmitted] = useState(Boolean(initialScoresA));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [swiped, setSwiped] = useState(false);
  const [swipedWinnerTitle, setSwipedWinnerTitle] = useState<string | null>(null);

  const complete =
    categories.every((c) => scoresA[c.key] !== undefined) &&
    categories.every((c) => scoresB[c.key] !== undefined);

  // Only offered on a matchup the voter hasn't scored yet — prevents an
  // accidental re-swipe from silently overwriting a considered vote. Once
  // swiped this session, the card gives way to the static header + a
  // confirmation line instead of leaving its own reserved space behind.
  const showSwipeCard = !initialScoresA && !swiped;

  function handleSwipe(winner: "A" | "B") {
    const { scoresA: a, scoresB: b } = swipeToScores(
      categories.map((c) => c.key),
      winner,
    );
    setScoresA(a);
    setScoresB(b);
    setSwiped(true);
    setSwipedWinnerTitle(winner === "A" ? movieA.title : movieB.title);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitVote({ matchupId, scoresMovieA: scoresA, scoresMovieB: scoresB });
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
        <div className="mb-4 flex items-center justify-center gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            {movieA.posterUrl && (
              <PosterButton
                movie={movieA}
                width={84}
                height={126}
                imageClassName="rounded-md shadow-[0_10px_22px_-8px_rgba(0,0,0,0.8)]"
              />
            )}
            <span className="font-medium">{movieA.title}</span>
          </div>
          <span className="font-display text-rose">vs</span>
          <div className="flex flex-col items-center gap-2">
            {movieB.posterUrl && (
              <PosterButton
                movie={movieB}
                width={84}
                height={126}
                imageClassName="rounded-md shadow-[0_10px_22px_-8px_rgba(0,0,0,0.8)]"
              />
            )}
            <span className="font-medium">{movieB.title}</span>
          </div>
        </div>
      )}

      {swiped && swipedWinnerTitle && (
        <p className="mb-4 text-center text-sm text-cream-dim">
          You picked <span className="font-medium text-gold">{swipedWinnerTitle}</span> — adjust the scores
          below if you&apos;d like.
        </p>
      )}

      {showSwipeCard && (
        <SwipeMatchupCard
          movieA={{ title: movieA.title, posterUrl: movieA.posterUrl }}
          movieB={{ title: movieB.title, posterUrl: movieB.posterUrl }}
          onSwipe={handleSwipe}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <ScorePicker title={movieA.title} categories={categories} scores={scoresA} setScores={setScoresA} />
        <ScorePicker
          title={movieB.title}
          categories={categories}
          scores={scoresB}
          setScores={setScoresB}
          divider
        />
      </div>

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
