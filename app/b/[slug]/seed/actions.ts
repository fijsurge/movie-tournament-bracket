"use server";

import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { submitSeedVoteSchema } from "@/lib/validation";

export interface SeedVoteState {
  error: string | null;
}

export async function submitSeedVote(bracketId: string, formInput: unknown): Promise<SeedVoteState> {
  const parsed = submitSeedVoteSchema.safeParse({ bracketId, ...(formInput as object) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid rating" };
  }
  const { movieId, score } = parsed.data;

  const voterId = await getVoterId(bracketId);
  if (!voterId) {
    return { error: "You need to identify yourself first" };
  }

  const bracket = await prisma.bracket.findUnique({ where: { id: bracketId } });
  if (!bracket || bracket.status !== "SEEDING") {
    return { error: "Seeding isn't open right now" };
  }

  await prisma.seedVote.upsert({
    where: { movieId_voterId: { movieId, voterId } },
    update: { score },
    create: { bracketId, movieId, voterId, score },
  });

  return { error: null };
}
