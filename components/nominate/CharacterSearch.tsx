"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/shared/Spinner";

export interface CharacterSearchResult {
  personId: number;
  name: string;
  profileUrl: string | null;
}

// Mirrors MovieSearch.tsx exactly, just searching TMDb people instead of
// movies — no bracketId/hasFilters, since actor search isn't scoped by a
// bracket's movie-search filters (company/keyword/genre/year don't apply).
export function CharacterSearch({
  onPick,
  disabled,
  excludePersonIds = [],
}: {
  onPick: (person: CharacterSearchResult) => void;
  disabled?: boolean;
  excludePersonIds?: number[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CharacterSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({ q: query });
      fetch(`/api/people/search?${params}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for an actor…"
        disabled={disabled}
        className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none disabled:opacity-50"
      />
      {loading && (
        <p className="flex items-center gap-2 text-sm text-cream-dim">
          <Spinner className="h-4 w-4" /> Searching…
        </p>
      )}
      {results.length > 0 && (
        <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {results.map((person) => {
            const alreadyAdded = excludePersonIds.includes(person.personId);
            return (
              <li key={person.personId}>
                <button
                  type="button"
                  disabled={disabled || alreadyAdded}
                  onClick={() => {
                    onPick(person);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg bg-surface p-2 text-left shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-8px_rgba(232,163,61,0.25)] active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  {person.profileUrl ? (
                    <Image
                      src={person.profileUrl}
                      alt=""
                      width={48}
                      height={72}
                      className="rounded object-cover shadow-[0_4px_10px_-4px_rgba(0,0,0,0.7)]"
                    />
                  ) : (
                    <div className="h-[72px] w-12 shrink-0 rounded bg-surface-raised" />
                  )}
                  <span>
                    {person.name}
                    {alreadyAdded && <span className="ml-2 text-xs text-cream-dim">already in pool</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
