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
        <h1 className="text-2xl font-semibold">{bracket.name}</h1>
        <p className="text-neutral-500">Status: {bracket.status}</p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900"
          >
            Continue
          </Link>
        ) : (
          <p className="text-sm text-neutral-500">
            {bracket.status === "SETUP"
              ? "This bracket hasn't opened yet — check back soon."
              : "This bracket is complete!"}
          </p>
        )}
      </div>
    </main>
  );
}
