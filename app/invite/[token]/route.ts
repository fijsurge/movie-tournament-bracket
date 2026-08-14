import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setVoterCookie } from "@/lib/voter-cookie";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const voter = await prisma.voter.findUnique({
    where: { inviteToken: token },
    include: { bracket: true, person: true },
  });

  if (!voter) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await setVoterCookie(voter.bracketId, voter.id);

  // Clicking this link is already proof of inbox ownership — only the true
  // owner could click it — so it's safe to mark the email verified. This
  // does NOT also start a person_id login session: unlike a magic-link
  // token, invite tokens are non-expiring and reusable by anyone the link
  // is ever forwarded to, which is fine for "become a voter here" but too
  // wide a blast radius for minting a persistent, cross-bracket, promotable
  // session — that only ever comes from the single-use magic-link flow.
  if (voter.person && !voter.person.emailVerifiedAt) {
    await prisma.person.update({ where: { id: voter.person.id }, data: { emailVerifiedAt: new Date() } });
  }

  if (voter.person && !voter.person.avatar) {
    return NextResponse.redirect(new URL(`/b/${voter.bracket.slug}/account`, request.url));
  }
  return NextResponse.redirect(new URL(`/b/${voter.bracket.slug}`, request.url));
}
