import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { PageNav } from "@/components/shared/PageNav";
import { logoutAdmin } from "./actions";

export default async function AdminHomePage() {
  await requireAdmin();

  const brackets = await prisma.bracket.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageNav
        backHref="/"
        backLabel="Home"
        action={
          <form action={logoutAdmin}>
            <button type="submit" className="text-cream-dim underline underline-offset-2">
              Log out
            </button>
          </form>
        }
      />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">Brackets</h1>
        <Link
          href="/admin/brackets/new"
          className="rounded-full bg-gold px-4 py-2 font-medium text-ink transition hover:bg-gold-dim"
        >
          + New bracket
        </Link>
      </div>

      {brackets.length === 0 ? (
        <p className="text-cream-dim">No brackets yet — create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {brackets.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/brackets/${b.slug}`}
                className="flex items-center justify-between rounded border border-gold/20 bg-surface px-4 py-3 transition hover:border-gold/40"
              >
                <span>{b.name}</span>
                <span className="text-sm text-cream-dim">{b.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
