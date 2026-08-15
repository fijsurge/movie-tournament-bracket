"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireBracketAdmin } from "@/lib/bracket-auth";
import { normalizeVoterName } from "@/lib/voter-cookie";
import { inviteVotersSchema, submitNominationSchema } from "@/lib/validation";
import { sendInviteEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";
import { getMovieDetails } from "@/lib/tmdb";
import {
  closeNominationsCore,
  closeSeedingCore,
  quickSeedCore,
  closeRoundCore,
  undoLastPhase as undoLastPhaseCore,
  maybeAutoAdvance,
} from "@/lib/phase-transitions";
import { notifyCurrentTurn } from "@/lib/turn-notify";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function undoLastPhase(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  await undoLastPhaseCore(bracketId);
}

export async function toggleAutoAdvance(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  await prisma.bracket.update({ where: { id: bracketId }, data: { autoAdvance: !bracket.autoAdvance } });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function toggleArchived(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  await prisma.bracket.update({ where: { id: bracketId }, data: { archived: !bracket.archived } });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteBracket(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  await prisma.bracket.delete({ where: { id: bracketId } });
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function openNominations(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (bracket.status !== "SETUP") return;
  await prisma.bracket.update({ where: { id: bracketId }, data: { status: "NOMINATING" } });
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function startDraft(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { voters: true },
  });
  if (bracket.status !== "NOMINATING" || bracket.nominationMode !== "DRAFT") return;

  await prisma.draftState.upsert({
    where: { bracketId },
    update: { turnOrder: JSON.stringify(shuffle(bracket.voters.map((v) => v.id))), currentTurnIndex: 0 },
    create: { bracketId, turnOrder: JSON.stringify(shuffle(bracket.voters.map((v) => v.id))), currentTurnIndex: 0 },
  });
  await notifyCurrentTurn(bracketId);
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function skipDraftTurn(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({
    where: { id: bracketId },
    include: { draftState: true },
  });
  if (!bracket.draftState) return;
  const turnOrder = JSON.parse(bracket.draftState.turnOrder) as string[];
  await prisma.draftState.update({
    where: { bracketId },
    data: { currentTurnIndex: (bracket.draftState.currentTurnIndex + 1) % turnOrder.length },
  });
  await notifyCurrentTurn(bracketId);
  revalidatePath(`/admin/brackets/${bracket.slug}`);
}

export async function closeNominations(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  await closeNominationsCore(bracketId);
}

export async function closeSeeding(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  await closeSeedingCore(bracketId);
}

export async function quickSeed(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  await quickSeedCore(bracketId);
}

export async function closeRound(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  await closeRoundCore(bracketId);
}

export async function resolveTiebreakCoinFlip(matchupId: string): Promise<void> {
  const matchup = await prisma.matchup.findUniqueOrThrow({
    where: { id: matchupId },
    include: { bracket: true },
  });
  await requireBracketAdmin(matchup.bracketId);
  if (matchup.status !== "NEEDS_MANUAL_TIEBREAK" || !matchup.movieAId || !matchup.movieBId) return;

  const winnerMovieId = randomInt(2) === 0 ? matchup.movieAId : matchup.movieBId;

  await prisma.$transaction(async (tx) => {
    await tx.matchup.update({
      where: { id: matchupId },
      data: { status: "RESOLVED", winnerMovieId, resolutionMethod: "COIN_FLIP" },
    });
    if (matchup.nextMatchupId && matchup.nextMatchupSlot) {
      await tx.matchup.update({
        where: { id: matchup.nextMatchupId },
        data: matchup.nextMatchupSlot === "A" ? { movieAId: winnerMovieId } : { movieBId: winnerMovieId },
      });
    }
  });
  revalidatePath(`/admin/brackets/${matchup.bracket.slug}`);
}

export async function reopenForRevote(matchupId: string): Promise<void> {
  const matchup = await prisma.matchup.findUniqueOrThrow({
    where: { id: matchupId },
    include: { bracket: true },
  });
  await requireBracketAdmin(matchup.bracketId);
  if (matchup.status !== "NEEDS_MANUAL_TIEBREAK") return;

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany({ where: { matchupId } });
    await tx.matchup.update({ where: { id: matchupId }, data: { status: "OPEN" } });
  });
  revalidatePath(`/admin/brackets/${matchup.bracket.slug}`);
}

export interface InviteVotersState {
  error: string | null;
  sentCount: number;
  failures: { email: string; error: string }[];
}

export async function inviteVoters(
  bracketId: string,
  _prevState: InviteVotersState,
  formData: FormData,
): Promise<InviteVotersState> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });

  const raw = JSON.parse(String(formData.get("votersJson") ?? "[]"));
  const parsed = inviteVotersSchema.safeParse({ bracketId, voters: raw });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", sentCount: 0, failures: [] };
  }

  const baseUrl = await getBaseUrl();
  const failures: { email: string; error: string }[] = [];
  let sentCount = 0;

  for (const { name, email } of parsed.data.voters) {
    try {
      // A saved Person's name/avatar are authoritative — re-inviting someone
      // who already has an account never silently renames them; they change
      // their own name via the account settings page instead.
      const person = await prisma.person.upsert({
        where: { email },
        update: {},
        create: { email, name: name.trim() },
      });

      const normalizedName = normalizeVoterName(person.name);
      let voter = await prisma.voter.upsert({
        where: { bracketId_normalizedName: { bracketId, normalizedName } },
        update: { personId: person.id },
        create: { bracketId, name: person.name, normalizedName, personId: person.id },
      });

      if (!voter.inviteToken || voter.email !== email) {
        voter = await prisma.voter.update({
          where: { id: voter.id },
          data: { email, inviteToken: voter.inviteToken ?? randomUUID(), invitedAt: new Date() },
        });
      }

      const result = await sendInviteEmail({
        to: email,
        voterName: person.name,
        bracketName: bracket.name,
        inviteUrl: `${baseUrl}/invite/${voter.inviteToken}`,
      });

      if (result.error) {
        failures.push({ email, error: result.error });
      } else {
        sentCount++;
      }
    } catch (err) {
      failures.push({ email, error: err instanceof Error ? err.message : "Failed to invite" });
    }
  }

  revalidatePath(`/admin/brackets/${bracket.slug}`);
  return { error: null, sentCount, failures };
}

// Requires a linked, verified Person — re-validated here even though the UI
// also disables this control, since there'd be no way to log back in as an
// unverified guest to exercise the access later.
export async function promoteVoter(bracketId: string, voterId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const voter = await prisma.voter.findUniqueOrThrow({ where: { id: voterId }, include: { person: true, bracket: true } });
  if (voter.bracketId !== bracketId || !voter.person?.emailVerifiedAt) return;
  await prisma.voter.update({ where: { id: voterId }, data: { role: "ADMIN" } });
  revalidatePath(`/admin/brackets/${voter.bracket.slug}`);
}

export async function demoteVoter(bracketId: string, voterId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const voter = await prisma.voter.findUniqueOrThrow({ where: { id: voterId }, include: { bracket: true } });
  if (voter.bracketId !== bracketId) return;
  await prisma.voter.update({ where: { id: voterId }, data: { role: "VOTER" } });
  revalidatePath(`/admin/brackets/${voter.bracket.slug}`);
}

export interface AdminAddMovieState {
  error: string | null;
}

// Mirrors submitDraftPick (app/b/[slug]/draft/actions.ts) minus the
// voter/turn checks — an admin-added movie is unattributed
// (nominatedByVoterId stays null) and never consumes a draft turn, so it can
// be added mid-draft without disrupting turn order.
export async function adminAddMovie(bracketId: string, formInput: unknown): Promise<AdminAddMovieState> {
  await requireBracketAdmin(bracketId);
  const parsed = submitNominationSchema.safeParse({ bracketId, ...(formInput as object) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid movie" };
  }
  const { tmdbId, title, posterUrl } = parsed.data;

  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (bracket.status !== "SETUP" && bracket.status !== "NOMINATING") {
    return { error: "The pool can only be edited before seeding starts" };
  }

  const existing = await prisma.movie.findUnique({ where: { bracketId_tmdbId: { bracketId, tmdbId } } });
  if (existing) {
    return { error: "That movie is already in the pool" };
  }

  const details = await getMovieDetails(tmdbId);
  await prisma.movie.create({
    data: {
      bracketId,
      tmdbId,
      title,
      posterUrl,
      overview: details?.overview ?? null,
      voteAverage: details?.voteAverage ?? null,
      popularity: details?.popularity ?? null,
      releaseYear: details?.releaseYear ?? null,
      runtime: details?.runtime ?? null,
      trailerKey: details?.trailerKey ?? null,
    },
  });

  // DRAFT mode's own pool-target completion check lives inside
  // submitDraftPick, not maybeAutoAdvance (see its comment) — an admin add
  // that happens to exactly fill a DRAFT pool completes on the next real
  // turn rather than instantly. This call still matters for OPEN mode's
  // per-voter-cap check, which is unaffected by an unattributed admin add.
  await maybeAutoAdvance(bracketId);

  revalidatePath(`/admin/brackets/${bracket.slug}`);
  return { error: null };
}

// Distinct from undoLastPhase, which deliberately never touches Movie rows
// (it only reverts Bracket.status, so an accidental "close nominations"
// click can't lose real nominations). This is the actual "start the pool
// over" action, including the DraftState so a DRAFT bracket cleanly falls
// back to "Start draft" instead of resuming a stale turn order.
export async function clearNominationPool(bracketId: string): Promise<void> {
  await requireBracketAdmin(bracketId);
  const bracket = await prisma.bracket.findUniqueOrThrow({ where: { id: bracketId } });
  if (bracket.status !== "SETUP" && bracket.status !== "NOMINATING") return;

  await prisma.$transaction([
    prisma.movie.deleteMany({ where: { bracketId } }),
    prisma.draftState.deleteMany({ where: { bracketId } }),
  ]);

  revalidatePath(`/admin/brackets/${bracket.slug}`);
}
