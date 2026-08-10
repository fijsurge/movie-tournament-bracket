"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { submitVote } from "@/app/b/[slug]/vote/actions";

interface Category {
  key: string;
  label: string;
}

interface MovieInfo {
  id: string;
  title: string;
  posterUrl: string | null;
}

const SCORES = [1, 2, 3, 4, 5];

function ScorePicker({
  movie,
  categories,
  scores,
  setScores,
}: {
  movie: "A" | "B";
  categories: Category[];
  scores: Record<string, number>;
  setScores: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {categories.map((cat) => (
        <div key={cat.key} className="flex items-center justify-between gap-2">
          <span className="text-sm">{cat.label}</span>
          <div className="flex gap-1">
            {SCORES.map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setScores((prev) => ({ ...prev, [cat.key]: score }))}
                aria-pressed={scores[cat.key] === score}
                className={`h-7 w-7 rounded border text-xs ${
                  scores[cat.key] === score
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-neutral-500">
        Movie {movie} total: {categories.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0)}
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

  const complete =
    categories.every((c) => scoresA[c.key] !== undefined) &&
    categories.every((c) => scoresB[c.key] !== undefined);

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
    <div className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-center gap-4 text-center">
        <div className="flex flex-col items-center gap-1">
          {movieA.posterUrl && <Image src={movieA.posterUrl} alt="" width={56} height={84} className="rounded" />}
          <span className="font-medium">{movieA.title}</span>
        </div>
        <span className="text-neutral-400">vs</span>
        <div className="flex flex-col items-center gap-1">
          {movieB.posterUrl && <Image src={movieB.posterUrl} alt="" width={56} height={84} className="rounded" />}
          <span className="font-medium">{movieB.title}</span>
        </div>
      </div>

      <div className="flex gap-6">
        <ScorePicker movie="A" categories={categories} scores={scoresA} setScores={setScoresA} />
        <ScorePicker movie="B" categories={categories} scores={scoresB} setScores={setScoresB} />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!complete || pending}
        className="mt-4 w-full rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {submitted ? "Update vote" : pending ? "Submitting…" : "Submit vote"}
      </button>
      {submitted && <p className="mt-1 text-center text-xs text-neutral-500">Vote recorded — you can change it until the round closes.</p>}
    </div>
  );
}
