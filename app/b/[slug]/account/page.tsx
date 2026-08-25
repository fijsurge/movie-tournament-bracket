import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { BracketNav } from "@/components/voting/BracketNav";
import { AccountForm } from "@/components/voting/AccountForm";
import { effectiveVoterName, effectiveVoterAvatar } from "@/lib/voter-display";
import { safeNextPath } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { slug } = await params;
  const { next } = await searchParams;
  const bracket = await prisma.bracket.findUnique({ where: { slug } });
  if (!bracket) notFound();

  const voterId = await getVoterId(bracket.id);
  const voter = voterId
    ? await prisma.voter.findUnique({ where: { id: voterId }, include: { person: true } })
    : null;

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <BracketNav slug={bracket.slug} bracketName={bracket.name} bracketId={bracket.id} />
      <h1 className="mb-4 font-display text-2xl tracking-wide text-gold uppercase">My account</h1>
      {voter ? (
        <AccountForm
          bracketId={bracket.id}
          slug={bracket.slug}
          currentName={effectiveVoterName(voter)}
          currentAvatar={effectiveVoterAvatar(voter)}
          currentEmail={voter.person?.email ?? voter.email}
          isLinked={Boolean(voter.personId)}
          next={next ? safeNextPath(next, `/b/${bracket.slug}`) : undefined}
        />
      ) : (
        <p className="text-cream-dim">
          You haven&apos;t joined this bracket yet — head back to{" "}
          <Link href={`/b/${bracket.slug}`} className="text-gold underline underline-offset-2">
            the bracket
          </Link>{" "}
          and identify yourself first.
        </p>
      )}
    </main>
  );
}
