import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { VoterIdentify } from "@/components/voting/VoterIdentify";
import { BracketNav } from "@/components/voting/BracketNav";
import { SeedRatingPanel } from "@/components/seed/SeedRatingPanel";
import { FirstTimeTip } from "@/components/shared/FirstTimeTip";

export default async function SeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: { voters: true, movies: { orderBy: { createdAt: "asc" } } },
  });
  if (!bracket) notFound();

  if (bracket.status !== "SEEDING") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <p>Seeding isn&apos;t open for this bracket right now (status: {bracket.status}).</p>
      </main>
    );
  }

  const voterId = await getVoterId(bracket.id);
  const voter = voterId ? bracket.voters.find((v) => v.id === voterId) : null;

  let initialRatings: Record<string, number> = {};
  if (voter) {
    const myVotes = await prisma.seedVote.findMany({ where: { bracketId: bracket.id, voterId: voter.id } });
    initialRatings = Object.fromEntries(myVotes.map((v) => [v.movieId, v.score]));
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <BracketNav slug={bracket.slug} bracketName={bracket.name} />
      <h1 className="mb-4 font-display text-2xl tracking-wide text-gold uppercase">{bracket.name}: Seed the bracket</h1>
      {voter ? (
        <div className="flex flex-col gap-4">
          <FirstTimeTip id="seed">
            Rate each movie 1-5 overall. The group&apos;s average ratings set the seeds — favorites get
            spread apart so they don&apos;t face off too early.
          </FirstTimeTip>
          <SeedRatingPanel
            bracketId={bracket.id}
            movies={bracket.movies.map((m) => ({ id: m.id, title: m.title, posterUrl: m.posterUrl }))}
            initialRatings={initialRatings}
          />
        </div>
      ) : (
        <VoterIdentify
          bracketId={bracket.id}
          redirectTo={`/b/${bracket.slug}/seed`}
          existingVoterNames={bracket.voters.map((v) => v.name)}
        />
      )}
    </main>
  );
}
