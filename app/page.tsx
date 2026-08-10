import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import iconMark from "@/images/icon-mark.png";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default async function Home() {
  const brackets = await prisma.bracket.findMany({
    orderBy: { createdAt: "desc" },
    include: { movies: { orderBy: { createdAt: "asc" }, take: 5 }, _count: { select: { movies: true } } },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Image src={iconMark} alt="" width={72} priority className="drop-shadow-[0_0_30px_rgba(232,163,61,0.3)]" />
        <h1 className="font-display text-4xl tracking-wide text-gold uppercase">Movie Madness Bracket</h1>
        <p className="text-sm text-cream-dim">Settle the debate. One matchup at a time.</p>
      </div>

      {brackets.length === 0 ? (
        <p className="text-center text-cream-dim">No brackets yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {brackets.map((b) => (
            <li key={b.id}>
              <Link
                href={`/b/${b.slug}`}
                className="flex items-center gap-4 rounded-lg border border-gold/15 bg-surface p-4 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.7)] transition hover:border-gold/40 hover:shadow-[0_10px_28px_-10px_rgba(232,163,61,0.2)]"
              >
                <div className="flex -space-x-4">
                  {b.movies.length > 0 ? (
                    b.movies.map((m) =>
                      m.posterUrl ? (
                        <Image
                          key={m.id}
                          src={m.posterUrl}
                          alt=""
                          width={40}
                          height={60}
                          className="rounded shadow-md ring-2 ring-surface"
                        />
                      ) : (
                        <div key={m.id} className="h-[60px] w-10 rounded bg-surface-raised ring-2 ring-surface" />
                      ),
                    )
                  ) : (
                    <div className="flex h-[60px] w-10 items-center justify-center rounded bg-surface-raised text-cream-dim/50 ring-2 ring-surface">
                      🎬
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display tracking-wide text-cream uppercase">{b.name}</p>
                  <p className="text-xs text-cream-dim">{b._count.movies} movies</p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin/login" className="self-center text-sm text-cream-dim underline underline-offset-2">
        Admin
      </Link>
    </main>
  );
}
