import "server-only";
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD environment variables must be set");
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendMagicLinkEmail({
  to,
  loginUrl,
}: {
  to: string;
  loginUrl: string;
}): Promise<{ error: string | null }> {
  try {
    await getTransporter().sendMail({
      from: `Movie Madness Bracket <${process.env.GMAIL_USER}>`,
      to,
      subject: "Your login link",
      html: `
        <p><a href="${loginUrl}">Tap here to log in</a> — this link works once and expires in 30 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send email" };
  }
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
  try {
    await getTransporter().sendMail({
      from: `Movie Madness Bracket <${process.env.GMAIL_USER}>`,
      to,
      subject: `You're in: ${bracketName}`,
      html: `
        <p>Hi ${voterName},</p>
        <p>You've been invited to nominate and vote in <strong>${bracketName}</strong>.</p>
        <p><a href="${inviteUrl}">Tap here to join</a> — no need to sign in or type your name, this link knows who you are.</p>
      `,
    });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send email" };
  }
}
