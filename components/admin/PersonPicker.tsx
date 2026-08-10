"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
        <button type="button" onClick={() => onChange(null)} className="text-sm text-neutral-500 underline">
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
        className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
      />
      {loading && <p className="text-sm text-neutral-500">Searching…</p>}
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
                className="flex w-full items-center gap-2 rounded border border-neutral-200 p-2 text-left text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                {p.profileUrl ? (
                  <Image src={p.profileUrl} alt="" width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
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
