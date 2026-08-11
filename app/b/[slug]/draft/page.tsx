import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { VoterIdentify } from "@/components/voting/VoterIdentify";
import { BracketNav } from "@/components/voting/BracketNav";
import { DraftBoard } from "@/components/nominate/DraftBoard";
import { FirstTimeTip } from "@/components/shared/FirstTimeTip";
import { PhaseWatcher } from "@/components/shared/PhaseWatcher";

export default async function DraftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({ where: { slug }, include: { voters: true } });
  if (!bracket) notFound();

  if (bracket.nominationMode !== "DRAFT") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <PhaseWatcher slug={bracket.slug} status={bracket.status} />
        <p>This bracket uses open nominations. Head to the nominate page instead.</p>
      </main>
    );
  }

  if (bracket.status === "SETUP") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <PhaseWatcher slug={bracket.slug} status={bracket.status} />
        <p>The draft hasn&apos;t opened yet — check back soon.</p>
      </main>
    );
  }

  const voterId = await getVoterId(bracket.id);
  const voter = voterId ? bracket.voters.find((v) => v.id === voterId) : null;

  return (
    <main className="mx-auto max-w-xl p-6">
      <BracketNav slug={bracket.slug} bracketName={bracket.name} />
      <PhaseWatcher slug={bracket.slug} status={bracket.status} />
      <h1 className="mb-4 font-display text-2xl tracking-wide text-gold uppercase">{bracket.name}: Draft</h1>
      {voter ? (
        <div className="flex flex-col gap-4">
          <FirstTimeTip id="draft">
            Movies get picked in turns, like a fantasy draft. When it&apos;s your turn you&apos;ll get a
            search box — everyone else sees the board update live.
          </FirstTimeTip>
          <DraftBoard bracketId={bracket.id} slug={bracket.slug} voterName={voter.name} />
        </div>
      ) : (
        <VoterIdentify
          bracketId={bracket.id}
          redirectTo={`/b/${bracket.slug}/draft`}
          existingVoters={bracket.voters.map((v) => ({ name: v.name, avatar: v.avatar }))}
        />
      )}
    </main>
  );
}
