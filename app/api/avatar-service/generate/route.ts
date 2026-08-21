import { NextResponse } from "next/server";
import { buildAvatarPrompt, isPromptSafe, type AvatarFormat } from "@/lib/avatar-prompts";

export const dynamic = "force-dynamic";

// AvatarPicker (components/voting/AvatarPicker.tsx) is shared by both the
// bracket-scoped account form and the global one (app/account), so this
// lives as a standalone route rather than a server action tied to either
// route tree — same reasoning as /api/movies/search being its own route
// instead of living under one page's actions file.
//
// No session check here: the actual protected resource is the Hugging
// Face Space itself, gated by AVATAR_SERVICE_SECRET below — a request to
// this route without a logged-in session just re-does what any visitor
// could already trigger by opening the account page, and this app's scale
// (a small trusted group) doesn't call for more than that.
export async function POST(request: Request) {
  const serviceUrl = process.env.AVATAR_SERVICE_URL;
  const secret = process.env.AVATAR_SERVICE_SECRET;
  if (!serviceUrl || !secret) {
    return NextResponse.json({ error: "Avatar generation isn't set up yet" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { themeKey, paletteKey, styleKey, detail, format, posterTitle } = body as Record<string, unknown>;
  if (typeof themeKey !== "string" || typeof paletteKey !== "string" || typeof styleKey !== "string") {
    return NextResponse.json({ error: "Pick a theme, palette, and style" }, { status: 400 });
  }
  const resolvedFormat: AvatarFormat = format === "poster" ? "poster" : "headshot";
  const trimmedDetail = typeof detail === "string" ? detail.trim().slice(0, 200) : undefined;
  if (trimmedDetail && !isPromptSafe(trimmedDetail)) {
    return NextResponse.json({ error: "That detail isn't allowed — try describing it differently" }, { status: 400 });
  }
  const trimmedTitle =
    resolvedFormat === "poster" && typeof posterTitle === "string" ? posterTitle.trim().slice(0, 40) : undefined;
  if (trimmedTitle && !isPromptSafe(trimmedTitle)) {
    return NextResponse.json({ error: "That title isn't allowed — try something else" }, { status: 400 });
  }

  let prompt: string;
  try {
    prompt = buildAvatarPrompt({
      themeKey,
      paletteKey,
      styleKey,
      detail: trimmedDetail,
      format: resolvedFormat,
      posterTitle: trimmedTitle,
    });
  } catch {
    return NextResponse.json({ error: "Pick a theme, palette, and style" }, { status: 400 });
  }

  const endpoint = `${serviceUrl.replace(/\/$/, "")}/generate`;
  const requestInit: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, secret, aspect: resolvedFormat === "poster" ? "portrait" : "square" }),
  };

  // Cloud Run occasionally aborts a request with "no available instance"
  // when it lands right as a fresh (scale-from-zero) instance is still
  // starting, instead of queueing it — a transient infra hiccup, not a
  // real failure. One retry after a short pause (long enough for that
  // instance to finish booting) turns it back into a success rather than
  // a hard error reaching the voter.
  let response: Response | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 3_000));
    try {
      // Cold start (instance booting) plus CPU inference can genuinely
      // take a couple of minutes worst-case — this is the one call in the
      // app meant to wait that long. The retry's backoff eats into this
      // route's own duration budget, so the first attempt gets less than
      // the full 150s to leave room for a second try.
      const timeoutMs = attempt === 0 ? 100_000 : 150_000;
      const res = await fetch(endpoint, { ...requestInit, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        response = res;
        break;
      }
      lastError = new Error(`Avatar service responded ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  if (!response) {
    console.error("Avatar generation failed after retry", lastError);
    return NextResponse.json({ error: "The avatar generator couldn't create an image — please try again" }, { status: 502 });
  }

  const data = (await response.json().catch(() => null)) as { image_base64?: string } | null;
  if (!data?.image_base64) {
    return NextResponse.json({ error: "The avatar generator returned an unexpected response" }, { status: 502 });
  }

  return NextResponse.json({ dataUrl: `data:image/png;base64,${data.image_base64}` });
}
