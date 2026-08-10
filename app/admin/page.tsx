import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export default async function AdminHomePage() {
  await requireAdmin();

  const brackets = await prisma.bracket.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Brackets</h1>
        <Link
          href="/admin/brackets/new"
          className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900"
        >
          + New bracket
        </Link>
      </div>

      {brackets.length === 0 ? (
        <p className="text-neutral-500">No brackets yet — create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {brackets.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/brackets/${b.slug}`}
                className="flex items-center justify-between rounded border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <span>{b.name}</span>
                <span className="text-sm text-neutral-500">{b.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
