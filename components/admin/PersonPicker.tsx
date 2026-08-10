"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/shared/Spinner";

interface PersonResult {
  personId: number;
  name: string;
  profileUrl: string | null;
}

export function PersonPicker({
  value,
  onChange,
}: {
  value: PersonResult | null;
  onChange: (person: PersonResult | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/people/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-2">
        {value.profileUrl && <Image src={value.profileUrl} alt="" width={32} height={32} className="rounded-full" />}
        <span className="text-sm font-medium">{value.name}</span>
        <button type="button" onClick={() => onChange(null)} className="text-sm text-gold underline underline-offset-2">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for an actor/director…"
        className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
      />
      {loading && (
        <p className="flex items-center gap-2 text-sm text-cream-dim">
          <Spinner className="h-4 w-4" /> Searching…
        </p>
      )}
      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((p) => (
            <li key={p.personId}>
              <button
                type="button"
                onClick={() => {
                  onChange(p);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full items-center gap-2 rounded border border-gold/15 p-2 text-left text-sm transition hover:border-gold/40 hover:bg-surface"
              >
                {p.profileUrl ? (
                  <Image src={p.profileUrl} alt="" width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-surface-raised" />
                )}
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
