"use client";

import { useActionState, useState } from "react";
import { createBracket, type CreateBracketState } from "@/app/admin/brackets/new/actions";
import { PersonPicker } from "@/components/admin/PersonPicker";
import { Spinner } from "@/components/shared/Spinner";
import { TMDB_GENRES } from "@/lib/genres";

interface PersonValue {
  personId: number;
  name: string;
  profileUrl: string | null;
}

interface CategoryRow {
  key: string;
  label: string;
  isTiebreaker: boolean;
}

const DEFAULT_CATEGORIES: CategoryRow[] = [
  { key: "story", label: "Story/Plot", isTiebreaker: false },
  { key: "acting", label: "Acting/Performance", isTiebreaker: false },
  { key: "entertainment", label: "Entertainment Value", isTiebreaker: false },
  { key: "cruise-factor", label: "Cruise Factor", isTiebreaker: true },
];

const INPUT = "rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none";
const LEGEND = "font-display text-lg tracking-wide text-gold uppercase";

function keyify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const initialState: CreateBracketState = { error: null };

export function NewBracketForm() {
  const [state, formAction, pending] = useActionState(createBracket, initialState);
  const [categories, setCategories] = useState<CategoryRow[]>(DEFAULT_CATEGORIES);
  const [nominationMode, setNominationMode] = useState<"OPEN" | "DRAFT">("OPEN");
  const [filterPerson, setFilterPerson] = useState<PersonValue | null>(null);
  const [filterGenreIds, setFilterGenreIds] = useState<number[]>([]);

  function toggleGenre(id: number) {
    setFilterGenreIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function updateLabel(index: number, label: string) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, label, key: keyify(label) || c.key } : c)),
    );
  }

  function setTiebreaker(index: number) {
    setCategories((prev) => prev.map((c, i) => ({ ...c, isTiebreaker: i === index })));
  }

  function addCategory() {
    setCategories((prev) => [...prev, { key: "", label: "", isTiebreaker: false }]);
  }

  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-cream-dim">
          Bracket name
        </label>
        <input id="name" name="name" required placeholder="Tom Cruise Movie Bracket" className={INPUT} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={LEGEND}>Rating categories (voters score both movies on each, 1-5)</legend>
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={cat.label}
              onChange={(e) => updateLabel(i, e.target.value)}
              placeholder="Category name"
              required
              className={`flex-1 ${INPUT}`}
            />
            <label className="flex items-center gap-1 text-sm whitespace-nowrap text-cream-dim">
              <input
                type="radio"
                name="tiebreaker"
                checked={cat.isTiebreaker}
                onChange={() => setTiebreaker(i)}
                className="accent-gold"
              />
              Tiebreaker
            </label>
            {categories.length > 1 && (
              <button
                type="button"
                onClick={() => removeCategory(i)}
                className="text-sm text-cream-dim hover:text-error"
                aria-label={`Remove ${cat.label || "category"}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {categories.length < 8 && (
          <button type="button" onClick={addCategory} className="self-start text-sm text-gold underline underline-offset-2">
            + Add category
          </button>
        )}
        <input type="hidden" name="categoriesJson" value={JSON.stringify(categories)} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={LEGEND}>How will movies get nominated?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nominationMode"
              value="OPEN"
              checked={nominationMode === "OPEN"}
              onChange={() => setNominationMode("OPEN")}
              className="accent-gold"
            />
            Open pool — everyone nominates a few, any time
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="nominationMode"
              value="DRAFT"
              checked={nominationMode === "DRAFT"}
              onChange={() => setNominationMode("DRAFT")}
              className="accent-gold"
            />
            Round-robin draft — turn-based picks
          </label>
        </div>

        {nominationMode === "OPEN" ? (
          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            Nominations per voter
            <input
              type="number"
              name="nominationCapPerVoter"
              min={1}
              max={10}
              defaultValue={2}
              required
              className={`w-24 ${INPUT}`}
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            Target pool size (how many movies total)
            <input
              type="number"
              name="poolTargetSize"
              min={2}
              max={64}
              defaultValue={16}
              required
              className={`w-24 ${INPUT}`}
            />
          </label>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={LEGEND}>
          Restrict the movie search (optional) — keeps nominations in scope, e.g. &ldquo;action movies
          from the 1980s&rdquo;
        </legend>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-cream-dim">Actor or director</span>
          <PersonPicker value={filterPerson} onChange={setFilterPerson} />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-cream-dim">Genres</span>
          <div className="flex flex-wrap gap-2">
            {TMDB_GENRES.map((g) => (
              <label
                key={g.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                  filterGenreIds.includes(g.id)
                    ? "border-gold bg-gold text-ink"
                    : "border-gold/25 text-cream-dim hover:border-gold/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filterGenreIds.includes(g.id)}
                  onChange={() => toggleGenre(g.id)}
                  className="hidden"
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            From year
            <input type="number" name="filterYearMin" placeholder="1980" min={1888} max={2100} className={`w-24 ${INPUT}`} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            To year
            <input type="number" name="filterYearMax" placeholder="1989" min={1888} max={2100} className={`w-24 ${INPUT}`} />
          </label>
        </div>

        <input type="hidden" name="filterPersonId" value={filterPerson?.personId ?? ""} />
        <input type="hidden" name="filterPersonName" value={filterPerson?.name ?? ""} />
        <input type="hidden" name="filterGenreIdsJson" value={JSON.stringify(filterGenreIds)} />
      </fieldset>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-gold px-6 py-2.5 font-medium text-ink transition hover:bg-gold-dim disabled:opacity-50"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" /> Creating…
          </span>
        ) : (
          "Create bracket"
        )}
      </button>
    </form>
  );
}
