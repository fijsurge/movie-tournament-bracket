import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PERSON_COOKIE_NAME, signPersonSession } from "@/lib/session-token";

// Every Vercel preview deployment gets its own unique URL, so a person_id
// cookie set on one preview never carries over to the next — with a new
// branch/PR (this project's normal workflow) for every feature, that meant
// re-doing the magic-link email login on nearly every preview visit.
// Production is unaffected: VERCEL_ENV is only "preview" on preview
// deployments, never in production or local dev.
//
// This auto-signs in as a single fixed test Person, entirely skipping the
// email round-trip — a convenience for preview testing, not a security
// boundary. Someone who has a specific preview URL could open it without
// authenticating, but preview URLs aren't discoverable/indexed, and this
// never runs in production.
const PREVIEW_TEST_EMAIL = "preview-tester@local.test";

export async function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") return NextResponse.next();
  if (request.cookies.has(PERSON_COOKIE_NAME)) return NextResponse.next();

  const person = await prisma.person.upsert({
    where: { email: PREVIEW_TEST_EMAIL },
    update: {},
    create: { email: PREVIEW_TEST_EMAIL, name: "Preview Tester", emailVerifiedAt: new Date() },
  });

  const response = NextResponse.next();
  response.cookies.set(PERSON_COOKIE_NAME, signPersonSession(person.id, person.sessionVersion), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export const config = {
  // Skip static assets, image optimization, and favicon — no point paying
  // a DB round-trip for those. API routes ARE included: some (like /account
  // actions) depend on person identity, and the has()-cookie fast path
  // above keeps steady-state overhead to a cheap cookie check once the
  // cookie's been set on the first request of a visit.
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
