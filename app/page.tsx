import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import iconMark from "@/images/icon-mark.png";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { LoginEmailForm } from "@/components/LoginEmailForm";
import { InfoIcon, SettingsIcon, AccountIcon } from "@/components/shared/Icons";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPersonId } from "@/lib/person-session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const personId = await getPersonId();

  const [brackets, isAdmin, myBrackets] = await Promise.all([
    prisma.bracket.findMany({
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      include: { movies: { orderBy: { createdAt: "asc" }, take: 5 }, _count: { select: { movies: true } } },
    }),
    isAdminAuthenticated(),
    personId
      ? prisma.voter.findMany({
          where: { personId },
          include: { bracket: true },
          orderBy: { bracket: { createdAt: "desc" } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Image src={iconMark} alt="" width={72} priority className="drop-shadow-[0_0_30px_rgba(232,163,61,0.3)]" />
        <h1 className="font-display text-4xl tracking-wide text-gold uppercase">Movie Madness Bracket</h1>
        <p className="text-sm text-cream-dim">Settle the debate. One matchup at a time.</p>
      </div>

      {personId ? (
        <section>
          <h2 className="font-display text-lg tracking-wide text-rose uppercase">My brackets</h2>
          {myBrackets.length === 0 ? (
            <p className="mt-2 text-sm text-cream-dim">You haven&apos;t joined any brackets yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {myBrackets.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/b/${v.bracket.slug}`}
                    className="flex items-center justify-between rounded-lg border border-gold/15 bg-surface p-3 transition hover:border-gold/40 active:scale-[0.99]"
                  >
                    <span className="truncate">{v.bracket.name}</span>
                    <StatusBadge status={v.bracket.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-gold/15 bg-surface p-4">
          <p className="mb-2 text-sm text-cream-dim">
            Log in to see your brackets here next time, on any device.
          </p>
          <LoginEmailForm />
        </section>
      )}

      {brackets.length === 0 ? (
        <p className="text-center text-cream-dim">No brackets yet.</p>
      ) : (
        <div>
          {personId && <h2 className="mb-2 font-display text-lg tracking-wide text-rose uppercase">All brackets</h2>}
          <ul className="flex flex-col gap-4">
            {brackets.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/b/${b.slug}`}
                  className="flex items-center gap-4 rounded-lg border border-gold/15 bg-surface p-4 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.7)] transition hover:border-gold/40 hover:shadow-[0_10px_28px_-10px_rgba(232,163,61,0.2)] active:scale-[0.99]"
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
        </div>
      )}

      <BottomTabBar
        links={[
          { href: "/about", label: "About", icon: <InfoIcon className="h-5 w-5" /> },
          ...(personId
            ? [{ href: "/account", label: "My account", icon: <AccountIcon className="h-5 w-5" /> }]
            : []),
          {
            href: isAdmin ? "/admin" : "/admin/login",
            label: "Admin",
            icon: <SettingsIcon className="h-5 w-5" />,
            accent: isAdmin,
          },
        ]}
      />
    </main>
  );
}
