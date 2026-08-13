import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { PageNav } from "@/components/shared/PageNav";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HomeIcon, LogOutIcon } from "@/components/shared/Icons";
import { logoutAdmin } from "./actions";

export default async function AdminHomePage() {
  await requireAdmin();

  const brackets = await prisma.bracket.findMany({
    orderBy: [{ archived: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageNav
        backHref="/"
        backLabel="Home"
        links={[{ href: "/", label: "Home", icon: HomeIcon }]}
        action={
          <form action={logoutAdmin}>
            <SubmitButton
              pendingLabel="…"
              className="flex items-center gap-1.5 text-cream-dim transition hover:text-gold active:scale-95"
            >
              <LogOutIcon className="h-4 w-4" /> Log out
            </SubmitButton>
          </form>
        }
      />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">Brackets</h1>
        <Link
          href="/admin/brackets/new"
          className="rounded-full bg-gold px-4 py-2 font-medium text-ink shadow-[0_4px_16px_-4px_rgba(232,163,61,0.5)] transition hover:bg-gold-dim active:scale-95"
        >
          + New bracket
        </Link>
      </div>

      {brackets.length === 0 ? (
        <p className="text-cream-dim">No brackets yet — create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {brackets.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/brackets/${b.slug}`}
                className={`flex items-center justify-between rounded-lg border border-gold/15 bg-surface px-5 py-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition hover:border-gold/40 hover:shadow-[0_8px_24px_-8px_rgba(232,163,61,0.25)] active:scale-[0.99] ${
                  b.archived ? "opacity-60" : ""
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {b.name}
                  {b.archived && (
                    <span className="rounded-full border border-cream-dim/30 px-2 py-0.5 text-xs text-cream-dim">
                      Archived
                    </span>
                  )}
                </span>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
