"use server";

import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/voter-cookie";
import { submitNominationSchema } from "@/lib/validation";

export interface DraftPickState {
  error: string | null;
}

export async function submitDraftPick(bracketId: string, formInput: unknown): Promise<DraftPickState> {
  const parsed = submitNominationSchema.safeParse({ bracketId, ...(formInput as object) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid movie" };
  }
  const { tmdbId, title, posterUrl } = parsed.data;

  const voterId = await getVoterId(bracketId);
  if (!voterId) {
    return { error: "You need to identify yourself first" };
  }

  const bracket = await prisma.bracket.findUnique({
    where: { id: bracketId },
    include: { draftState: true },
  });
  if (!bracket || bracket.status !== "NOMINATING" || bracket.nominationMode !== "DRAFT" || !bracket.draftState) {
    return { error: "The draft hasn't started yet" };
  }

  const turnOrder = JSON.parse(bracket.draftState.turnOrder) as string[];
  const currentVoterId = turnOrder[bracket.draftState.currentTurnIndex % turnOrder.length];
  if (currentVoterId !== voterId) {
    return { error: "It's not your turn" };
  }

  const existing = await prisma.movie.findUnique({ where: { bracketId_tmdbId: { bracketId, tmdbId } } });
  if (existing) {
    return { error: "That movie is already in the pool — pick another" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.movie.create({ data: { bracketId, tmdbId, title, posterUrl, nominatedByVoterId: voterId } });

    const poolCount = await tx.movie.count({ where: { bracketId } });
    const nextIndex = bracket.draftState!.currentTurnIndex + 1;

    if (bracket.poolTargetSize && poolCount >= bracket.poolTargetSize) {
      await tx.bracket.update({ where: { id: bracketId }, data: { status: "SEEDING" } });
    } else {
      await tx.draftState.update({
        where: { bracketId },
        data: { currentTurnIndex: nextIndex % turnOrder.length },
      });
    }
  });

  return { error: null };
}
