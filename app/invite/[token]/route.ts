import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setVoterCookie } from "@/lib/voter-cookie";
import { phaseHref } from "@/lib/phase-nav";

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
    // Send them to the actual current phase (nomination/voting/etc.) once
    // they finish setting up their profile, not the generic bracket
    // landing page that's itself just another click-through — this is
    // the one entry path (admin email invite) that didn't already thread
    // a next/redirectTo param, unlike self-serve join and magic-link login.
    const next = phaseHref(voter.bracket) ?? `/b/${voter.bracket.slug}`;
    const accountUrl = new URL(`/b/${voter.bracket.slug}/account`, request.url);
    accountUrl.searchParams.set("next", next);
    return NextResponse.redirect(accountUrl);
  }
  return NextResponse.redirect(new URL(`/b/${voter.bracket.slug}`, request.url));
}
