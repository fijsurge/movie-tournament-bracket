"use server";

import { prisma } from "@/lib/db";
import { requestLoginLinkSchema } from "@/lib/validation";
import {
  generateLoginToken,
  hashToken,
  LOGIN_TOKEN_TTL_MS,
  LOGIN_TOKEN_RESEND_COOLDOWN_MS,
} from "@/lib/login-token";
import { sendMagicLinkEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";
import { clearPersonSession, getPersonId } from "@/lib/person-session";

export interface RequestLoginLinkState {
  error: string | null;
  sent: boolean;
}

export async function requestLoginLink(
  _prevState: RequestLoginLinkState,
  formData: FormData,
): Promise<RequestLoginLinkState> {
  const parsed = requestLoginLinkSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email", sent: false };
  }
  const { email, next } = parsed.data;

  const person = await prisma.person.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split("@")[0] },
  });

  const now = Date.now();
  const tokenIssuedAt = person.loginTokenExpiresAt ? person.loginTokenExpiresAt.getTime() - LOGIN_TOKEN_TTL_MS : 0;
  // Don't leak whether the email exists or whether a link was just sent —
  // this branch silently no-ops (still returns the same generic response).
  if (now - tokenIssuedAt >= LOGIN_TOKEN_RESEND_COOLDOWN_MS) {
    const token = generateLoginToken();
    await prisma.person.update({
      where: { id: person.id },
      data: {
        loginTokenHash: hashToken(token),
        loginTokenExpiresAt: new Date(now + LOGIN_TOKEN_TTL_MS),
      },
    });

    const baseUrl = await getBaseUrl();
    const loginUrl = `${baseUrl}/login/${token}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    await sendMagicLinkEmail({ to: email, loginUrl });
  }

  return { error: null, sent: true };
}

export async function logoutPerson(): Promise<void> {
  const personId = await getPersonId();
  if (personId) {
    await clearPersonSession(personId);
  }
}
