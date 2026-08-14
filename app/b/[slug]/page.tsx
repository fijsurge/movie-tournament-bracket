import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BracketNav } from "@/components/voting/BracketNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoginNudge } from "@/components/LoginNudge";
import { phaseHref } from "@/lib/phase-nav";
import iconMark from "@/images/icon-mark.png";

export const dynamic = "force-dynamic";

export default async function PublicBracketLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: { movies: { orderBy: { createdAt: "asc" }, take: 5 } },
  });

  if (!bracket) {
    notFound();
  }

  const nextHref = phaseHref(bracket);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <BracketNav slug={bracket.slug} bracketName={bracket.name} bracketId={bracket.id} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Image src={iconMark} alt="" width={64} className="opacity-90 drop-shadow-[0_0_24px_rgba(232,163,61,0.25)]" />
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">{bracket.name}</h1>
        <StatusBadge status={bracket.status} />

        {bracket.movies.length > 0 && (
          <div className="flex -space-x-4">
            {bracket.movies.map((m) =>
              m.posterUrl ? (
                <Image
                  key={m.id}
                  src={m.posterUrl}
                  alt=""
                  width={48}
                  height={72}
                  className="rounded shadow-lg ring-2 ring-ink"
                />
              ) : null,
            )}
          </div>
        )}

        {nextHref ? (
          <Link
            href={nextHref}
            className="mt-2 flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 font-medium text-ink shadow-[0_4px_20px_-4px_rgba(232,163,61,0.5)] transition hover:bg-gold-dim active:scale-95"
          >
            Continue
          </Link>
        ) : (
          <p className="text-sm text-cream-dim">This bracket hasn&apos;t opened yet — check back soon.</p>
        )}
      </div>

      <LoginNudge bracketId={bracket.id} next={`/b/${bracket.slug}`} />
    </main>
  );
}
