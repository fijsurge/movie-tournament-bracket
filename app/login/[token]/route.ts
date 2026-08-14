import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/login-token";
import { setPersonSession } from "@/lib/person-session";
import { safeNextPath } from "@/lib/safe-redirect";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), "/");

  const person = await prisma.person.findUnique({ where: { loginTokenHash: hashToken(token) } });

  if (!person || !person.loginTokenExpiresAt || person.loginTokenExpiresAt < new Date()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const updated = await prisma.person.update({
    where: { id: person.id },
    data: {
      emailVerifiedAt: person.emailVerifiedAt ?? new Date(),
      // Single-use: clear the token so this same link can't be replayed.
      loginTokenHash: null,
      loginTokenExpiresAt: null,
    },
  });

  await setPersonSession(updated.id, updated.sessionVersion);

  return NextResponse.redirect(new URL(next, request.url));
}
