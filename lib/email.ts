import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendInviteEmail({
  to,
  voterName,
  bracketName,
  inviteUrl,
}: {
  to: string;
  voterName: string;
  bracketName: string;
  inviteUrl: string;
}): Promise<{ error: string | null }> {
  const from = process.env.RESEND_FROM_EMAIL ?? "Movie Madness Bracket <onboarding@resend.dev>";

  const { error } = await getClient().emails.send({
    from,
    to,
    subject: `You're in: ${bracketName}`,
    html: `
      <p>Hi ${voterName},</p>
      <p>You've been invited to nominate and vote in <strong>${bracketName}</strong>.</p>
      <p><a href="${inviteUrl}">Tap here to join</a> — no need to sign in or type your name, this link knows who you are.</p>
    `,
  });

  return { error: error?.message ?? null };
}
