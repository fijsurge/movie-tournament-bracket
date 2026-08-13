import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { VoterIdentify } from "@/components/voting/VoterIdentify";
import { BracketNav } from "@/components/voting/BracketNav";
import { VoteForm } from "@/components/voting/VoteForm";
import { FirstTimeTip } from "@/components/shared/FirstTimeTip";
import { PhaseWatcher } from "@/components/shared/PhaseWatcher";
import { effectiveVoterName, effectiveVoterAvatar } from "@/lib/voter-display";
import { phaseHref } from "@/lib/phase-nav";

export default async function VotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({
    where: { slug },
    include: { voters: { include: { person: true } }, categories: { orderBy: { order: "asc" } } },
  });
  if (!bracket) notFound();

  if (bracket.status === "COMPLETE") {
    const championMatchup = await prisma.matchup.findFirst({
      where: { bracketId: bracket.id, nextMatchupId: null },
      include: { winnerMovie: true },
    });
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <PhaseWatcher slug={bracket.slug} status={bracket.status} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <h1 className="font-display text-2xl tracking-wide text-gold uppercase">{bracket.name}</h1>
          <p className="text-lg">
            🏆 Champion: <span className="font-semibold text-gold">{championMatchup?.winnerMovie?.title}</span>
          </p>
        </div>
      </main>
    );
  }

  if (bracket.status !== "ACTIVE") {
    const dest = phaseHref(bracket);
    if (dest) redirect(dest);
    return (
      <main className="mx-auto max-w-xl p-6">
        <BracketNav slug={bracket.slug} bracketName={bracket.name} />
        <PhaseWatcher slug={bracket.slug} status={bracket.status} />
        <p>Voting isn&apos;t open for this bracket right now (status: {bracket.status}).</p>
      </main>
    );
  }

  const voterId = await getVoterId(bracket.id);
  const voter = voterId ? bracket.voters.find((v) => v.id === voterId) : null;

  const openMatchups = await prisma.matchup.findMany({
    where: { bracketId: bracket.id, round: { roundNumber: bracket.currentRound ?? 1 }, status: "OPEN" },
    include: { movieA: true, movieB: true, votes: voter ? { where: { voterId: voter.id } } : false },
    orderBy: { position: "asc" },
  });

  const categories = bracket.categories.map((c) => ({ key: c.key, label: c.label }));

  return (
    <main className="mx-auto max-w-xl p-6">
      <BracketNav slug={bracket.slug} bracketName={bracket.name} />
      <PhaseWatcher slug={bracket.slug} status={bracket.status} currentRound={bracket.currentRound} />
      <h1 className="mb-4 font-display text-2xl tracking-wide text-gold uppercase">
        {bracket.name}: Round {bracket.currentRound} voting
      </h1>
      {voter ? (
        <div className="flex flex-col gap-4">
          <FirstTimeTip id="vote">
            Score both movies on each category, 1-5. Your votes stay anonymous — only the combined totals
            are ever shown. Ties are broken by the tiebreaker category, then a coin flip or revote.
          </FirstTimeTip>
          {openMatchups.length === 0 ? (
            <p className="text-cream-dim">No matchups need your vote right now — check back soon.</p>
          ) : (
            openMatchups.map((m) => {
              if (!m.movieA || !m.movieB) return null;
              const myVote = "votes" in m && Array.isArray(m.votes) ? m.votes[0] : undefined;
              return (
                <VoteForm
                  key={m.id}
                  matchupId={m.id}
                  categories={categories}
                  movieA={{
                    id: m.movieA.id,
                    title: m.movieA.title,
                    posterUrl: m.movieA.posterUrl,
                    overview: m.movieA.overview,
                    voteAverage: m.movieA.voteAverage,
                    releaseYear: m.movieA.releaseYear,
                    runtime: m.movieA.runtime,
                    trailerKey: m.movieA.trailerKey,
                  }}
                  movieB={{
                    id: m.movieB.id,
                    title: m.movieB.title,
                    posterUrl: m.movieB.posterUrl,
                    overview: m.movieB.overview,
                    voteAverage: m.movieB.voteAverage,
                    releaseYear: m.movieB.releaseYear,
                    runtime: m.movieB.runtime,
                    trailerKey: m.movieB.trailerKey,
                  }}
                  initialScoresA={myVote ? JSON.parse(myVote.scoresMovieA) : undefined}
                  initialScoresB={myVote ? JSON.parse(myVote.scoresMovieB) : undefined}
                />
              );
            })
          )}
        </div>
      ) : (
        <VoterIdentify
          bracketId={bracket.id}
          redirectTo={`/b/${bracket.slug}/vote`}
          existingVoters={bracket.voters.map((v) => ({
            name: effectiveVoterName(v),
            avatar: effectiveVoterAvatar(v),
          }))}
        />
      )}
    </main>
  );
}
