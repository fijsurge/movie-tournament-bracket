import "server-only";
import { prisma } from "@/lib/db";
import { getBaseUrl } from "@/lib/base-url";
import { sendYourTurnEmail } from "@/lib/email";

// Centralizes "email whoever's turn it now is" so every call site that
// advances DraftState.currentTurnIndex (startDraft, submitDraftPick,
// skipDraftTurn) triggers the same notification instead of duplicating the
// lookup/send/stamp logic. Also reused by the daily cron sweep to re-send a
// nudge for a turn that's gone stale — same voter, same email, just fired
// again with a fresh turnNotifiedAt.
export async function notifyCurrentTurn(bracketId: string): Promise<void> {
  const bracket = await prisma.bracket.findUnique({
    where: { id: bracketId },
    include: { draftState: true },
  });
  if (!bracket?.draftState) return;

  const turnOrder = JSON.parse(bracket.draftState.turnOrder) as string[];
  if (turnOrder.length === 0) return;
  const voterId = turnOrder[bracket.draftState.currentTurnIndex % turnOrder.length];

  const voter = await prisma.voter.findUnique({ where: { id: voterId } });
  if (!voter?.email) return;

  const baseUrl = await getBaseUrl();
  const result = await sendYourTurnEmail({
    to: voter.email,
    voterName: voter.name,
    bracketName: bracket.name,
    draftUrl: `${baseUrl}/b/${bracket.slug}/draft`,
  });

  if (!result.error) {
    await prisma.draftState.update({ where: { bracketId }, data: { turnNotifiedAt: new Date() } });
  }
}
