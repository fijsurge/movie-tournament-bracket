import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageNav } from "@/components/shared/PageNav";

export default async function PublicBracketLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({ where: { slug } });

  if (!bracket) {
    notFound();
  }

  const nextHref =
    bracket.status === "NOMINATING"
      ? `/b/${bracket.slug}/${bracket.nominationMode === "DRAFT" ? "draft" : "nominate"}`
      : bracket.status === "SEEDING"
        ? `/b/${bracket.slug}/seed`
        : bracket.status === "ACTIVE"
          ? `/b/${bracket.slug}/vote`
          : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <PageNav backHref="/" backLabel="Home" links={[{ href: `/b/${bracket.slug}/tv`, label: "TV view" }]} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">{bracket.name}</h1>
        <p className="text-cream-dim">Status: {bracket.status}</p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-full bg-gold px-6 py-2.5 font-medium text-ink transition hover:bg-gold-dim"
          >
            Continue
          </Link>
        ) : (
          <p className="text-sm text-cream-dim">
            {bracket.status === "SETUP"
              ? "This bracket hasn't opened yet — check back soon."
              : "This bracket is complete!"}
          </p>
        )}
      </div>
    </main>
  );
}
