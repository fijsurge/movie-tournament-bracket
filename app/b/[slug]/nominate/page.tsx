import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { VoterIdentify } from "@/components/voting/VoterIdentify";
import { BracketNav } from "@/components/voting/BracketNav";
import { OpenNominationPanel } from "@/components/nominate/OpenNominationPanel";
import { FirstTimeTip } from "@/components/shared/FirstTimeTip";

export default async function NominatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({ where: { slug }, include: { voters: true } });
  if (!bracket) notFound();

  if (bracket.nominationMode !== "OPEN") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <p>This bracket uses draft-style nominations. Head to the draft page instead.</p>
      </main>
    );
  }

  if (bracket.status !== "NOMINATING") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <p>Nominations aren&apos;t open for this bracket right now (status: {bracket.status}).</p>
      </main>
    );
  }

  const voterId = await getVoterId(bracket.id);
  const voter = voterId ? bracket.voters.find((v) => v.id === voterId) : null;

  return (
    <main className="mx-auto max-w-xl p-6">
      <BracketNav slug={bracket.slug} bracketName={bracket.name} />
      <h1 className="mb-4 font-display text-2xl tracking-wide text-gold uppercase">{bracket.name}: Nominate movies</h1>
      {voter ? (
        <div className="flex flex-col gap-4">
          <FirstTimeTip id="nominate">
            Search for movies and add up to your limit. Everyone&apos;s picks merge into one shared pool —
            you&apos;ll vote on the final lineup&apos;s seeding next.
          </FirstTimeTip>
          <OpenNominationPanel bracketId={bracket.id} slug={bracket.slug} voterName={voter.name} />
        </div>
      ) : (
        <VoterIdentify
          bracketId={bracket.id}
          redirectTo={`/b/${bracket.slug}/nominate`}
          existingVoters={bracket.voters.map((v) => ({ name: v.name, avatar: v.avatar }))}
        />
      )}
    </main>
  );
}
