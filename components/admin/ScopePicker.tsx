"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/shared/Spinner";
import type { ScopeSearchResult } from "@/app/api/scope/search/route";

export interface ScopeItem {
  type: ScopeSearchResult["type"];
  id: number;
  name: string;
}

const TYPE_LABEL: Record<ScopeSearchResult["type"], string> = {
  person: "Actor/director",
  company: "Studio",
  keyword: "Theme",
  collection: "Franchise",
};

function itemKey(item: { type: string; id: number }) {
  return `${item.type}:${item.id}`;
}

// A single typeahead that fans out one typed query across person/company/
// keyword/collection search server-side, so "Marvel", "Agatha Christie", and
// "Harry Potter" are all found from the same box. Selections persist as
// removable chips above the search input, which stays active so more can be
// added — unlike a single-value picker's "value replaces input" behavior.
export function ScopePicker({
  value,
  onChange,
}: {
  value: ScopeItem[];
  onChange: (items: ScopeItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScopeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/scope/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const selectedKeys = new Set(value.map(itemKey));

  function add(item: ScopeSearchResult) {
    if (selectedKeys.has(itemKey(item))) return;
    onChange([...value, { type: item.type, id: item.id, name: item.name }]);
    setQuery("");
    setResults([]);
  }

  function remove(item: ScopeItem) {
    onChange(value.filter((v) => itemKey(v) !== itemKey(item)));
  }

  const hasKeywordResults = results.some((r) => r.type === "keyword");

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={itemKey(item)}
              className="flex items-center gap-1.5 rounded-full border border-gold bg-gold/10 py-1 pr-2 pl-3 text-sm"
            >
              <span className="text-xs text-gold-dim uppercase">{TYPE_LABEL[item.type]}</span>
              {item.name}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Remove ${item.name}`}
                className="text-cream-dim transition hover:text-error active:scale-95"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search actors, directors, studios, franchises…"
        className="rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
      />

      {loading && (
        <p className="flex items-center gap-2 text-sm text-cream-dim">
          <Spinner className="h-4 w-4" /> Searching…
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results
            .filter((r) => !selectedKeys.has(itemKey(r)))
            .map((r) => (
              <li key={itemKey(r)}>
                <button
                  type="button"
                  onClick={() => add(r)}
                  className="flex w-full items-center gap-2 rounded border border-gold/15 p-2 text-left text-sm transition hover:border-gold/40 hover:bg-surface active:scale-[0.98]"
                >
                  {r.imageUrl ? (
                    <Image src={r.imageUrl} alt="" width={28} height={28} className="rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 shrink-0 rounded-full bg-surface-raised" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  <span className="shrink-0 text-xs text-cream-dim uppercase">{TYPE_LABEL[r.type]}</span>
                </button>
              </li>
            ))}
        </ul>
      )}

      {hasKeywordResults && (
        <p className="text-xs text-cream-dim">Theme tag coverage varies — try the exact phrase if a title&apos;s missing.</p>
      )}
    </div>
  );
}
