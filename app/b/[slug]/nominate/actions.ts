"use server";

import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { submitNominationSchema, submitCharacterNominationSchema } from "@/lib/validation";
import { maybeAutoAdvance } from "@/lib/phase-transitions";
import { getMovieDetails, getPersonDetails } from "@/lib/tmdb";

export interface NominateState {
  error: string | null;
}

export async function submitNomination(bracketId: string, formInput: unknown): Promise<NominateState> {
  const parsed = submitNominationSchema.safeParse({ bracketId, ...(formInput as object) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid movie" };
  }
  const { tmdbId, title, posterUrl } = parsed.data;

  const voterId = await getVoterId(bracketId);
  if (!voterId) {
    return { error: "You need to identify yourself first" };
  }

  const bracket = await prisma.bracket.findUnique({ where: { id: bracketId } });
  if (!bracket || bracket.status !== "NOMINATING" || bracket.nominationMode !== "OPEN") {
    return { error: "Nominations aren't open right now" };
  }

  const existing = await prisma.movie.findUnique({
    where: { bracketId_tmdbId: { bracketId, tmdbId } },
  });
  if (existing) {
    return { error: null }; // already in the pool, nothing to do
  }

  if (bracket.nominationCapPerVoter) {
    const count = await prisma.movie.count({ where: { bracketId, nominatedByVoterId: voterId } });
    if (count >= bracket.nominationCapPerVoter) {
      return { error: `You've already nominated your ${bracket.nominationCapPerVoter} movie(s)` };
    }
  }

  const details = await getMovieDetails(tmdbId);

  await prisma.movie.create({
    data: {
      bracketId,
      tmdbId,
      title,
      posterUrl,
      nominatedByVoterId: voterId,
      overview: details?.overview ?? null,
      voteAverage: details?.voteAverage ?? null,
      popularity: details?.popularity ?? null,
      releaseYear: details?.releaseYear ?? null,
      runtime: details?.runtime ?? null,
      trailerKey: details?.trailerKey ?? null,
    },
  });

  await maybeAutoAdvance(bracketId);
  return { error: null };
}

export async function submitCharacterNomination(bracketId: string, formInput: unknown): Promise<NominateState> {
  const parsed = submitCharacterNominationSchema.safeParse({ bracketId, ...(formInput as object) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid nominee" };
  }
  const { actorTmdbId, actorName, actorPhotoUrl, filmTmdbId, filmTitle, filmYear } = parsed.data;

  const voterId = await getVoterId(bracketId);
  if (!voterId) {
    return { error: "You need to identify yourself first" };
  }

  const bracket = await prisma.bracket.findUnique({ where: { id: bracketId } });
  if (
    !bracket ||
    bracket.status !== "NOMINATING" ||
    bracket.nominationMode !== "OPEN" ||
    bracket.contentType !== "CHARACTER"
  ) {
    return { error: "Nominations aren't open right now" };
  }

  const existing = await prisma.movie.findUnique({
    where: { bracketId_tmdbId: { bracketId, tmdbId: actorTmdbId } },
  });
  if (existing) {
    return { error: null }; // already in the pool, nothing to do
  }

  if (bracket.nominationCapPerVoter) {
    const count = await prisma.movie.count({ where: { bracketId, nominatedByVoterId: voterId } });
    if (count >= bracket.nominationCapPerVoter) {
      return { error: `You've already nominated your ${bracket.nominationCapPerVoter} nominee(s)` };
    }
  }

  // Re-fetched server-side rather than trusted from the client payload,
  // same trust model as getMovieDetails above — falls back to the
  // search-result values if the detail lookup fails.
  const details = await getPersonDetails(actorTmdbId);

  await prisma.movie.create({
    data: {
      bracketId,
      tmdbId: actorTmdbId,
      title: details?.name ?? actorName,
      posterUrl: details?.profileUrl ?? actorPhotoUrl,
      filmTmdbId: filmTmdbId ?? null,
      filmTitle: filmTitle ?? null,
      filmYear: filmYear ?? null,
      nominatedByVoterId: voterId,
    },
  });

  await maybeAutoAdvance(bracketId);
  return { error: null };
}
