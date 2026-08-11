"use client";

import { useActionState, useState } from "react";
import { inviteVoters, type InviteVotersState } from "@/app/admin/brackets/[slug]/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { Avatar } from "@/components/shared/Avatar";

interface Row {
  name: string;
  email: string;
}

const INPUT =
  "rounded border border-gold/25 bg-surface px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none";

const initialState: InviteVotersState = { error: null, sentCount: 0, failures: [] };

export function InviteVoters({
  bracketId,
  invitedVoters,
}: {
  bracketId: string;
  invitedVoters: { id: string; name: string; email: string; avatar: string | null }[];
}) {
  const inviteVotersForBracket = inviteVoters.bind(null, bracketId);
  const [state, formAction, pending] = useActionState(inviteVotersForBracket, initialState);
  const [rows, setRows] = useState<Row[]>([{ name: "", email: "" }]);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", email: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const validRows = rows.filter((r) => r.name.trim() && r.email.trim());

  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-medium text-rose">Invite voters</h2>
      <p className="text-sm text-cream-dim">
        Add people by email — they get a link that identifies them automatically, no typing their name.
        Once everyone invited has done their part, the bracket moves to the next phase on its own.
      </p>

      {invitedVoters.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {invitedVoters.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-1.5 rounded-full border border-gold/15 bg-surface py-1 pr-3 pl-1 text-sm"
            >
              <Avatar name={v.name} avatar={v.avatar} size="sm" />
              {v.name}
              <span className="text-cream-dim">— {v.email}</span>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={row.name}
              onChange={(e) => updateRow(i, "name", e.target.value)}
              placeholder="Name"
              className={`w-32 ${INPUT}`}
            />
            <input
              value={row.email}
              onChange={(e) => updateRow(i, "email", e.target.value)}
              placeholder="email@example.com"
              type="email"
              className={`flex-1 ${INPUT}`}
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-sm text-cream-dim hover:text-error"
                aria-label="Remove row"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start text-sm text-gold underline underline-offset-2"
        >
          + Add another
        </button>
        <input type="hidden" name="votersJson" value={JSON.stringify(validRows)} />

        <SubmitButton
          disabled={validRows.length === 0}
          pendingLabel="Sending…"
          className="mt-1 self-start rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim disabled:opacity-50"
        >
          Send {validRows.length > 0 ? `${validRows.length} ` : ""}invite{validRows.length === 1 ? "" : "s"}
        </SubmitButton>
      </form>

      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {!pending && state.sentCount > 0 && (
        <p className="text-sm text-cream-dim">
          Sent {state.sentCount} invite{state.sentCount === 1 ? "" : "s"}.
        </p>
      )}
      {state.failures.length > 0 && (
        <ul className="text-sm text-error">
          {state.failures.map((f) => (
            <li key={f.email}>
              {f.email}: {f.error}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
