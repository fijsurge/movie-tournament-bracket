import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setVoterCookie } from "@/lib/voter-cookie";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const voter = await prisma.voter.findUnique({
    where: { inviteToken: token },
    include: { bracket: true },
  });

  if (!voter) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await setVoterCookie(voter.bracketId, voter.id);
  return NextResponse.redirect(new URL(`/b/${voter.bracket.slug}`, request.url));
}
