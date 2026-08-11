"use server";

import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { submitNominationSchema } from "@/lib/validation";
import { maybeAutoAdvance } from "@/lib/phase-transitions";

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

  await prisma.movie.create({
    data: { bracketId, tmdbId, title, posterUrl, nominatedByVoterId: voterId },
  });

  await maybeAutoAdvance(bracketId);
  return { error: null };
}
