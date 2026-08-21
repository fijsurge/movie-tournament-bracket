import { NextResponse } from "next/server";
import { buildAvatarPrompt, isPromptSafe } from "@/lib/avatar-prompts";

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
  const { themeKey, paletteKey, styleKey, detail } = body as Record<string, unknown>;
  if (typeof themeKey !== "string" || typeof paletteKey !== "string" || typeof styleKey !== "string") {
    return NextResponse.json({ error: "Pick a theme, palette, and style" }, { status: 400 });
  }
  const trimmedDetail = typeof detail === "string" ? detail.trim().slice(0, 200) : undefined;
  if (trimmedDetail && !isPromptSafe(trimmedDetail)) {
    return NextResponse.json({ error: "That detail isn't allowed — try describing it differently" }, { status: 400 });
  }

  let prompt: string;
  try {
    prompt = buildAvatarPrompt({ themeKey, paletteKey, styleKey, detail: trimmedDetail });
  } catch {
    return NextResponse.json({ error: "Pick a theme, palette, and style" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(`${serviceUrl.replace(/\/$/, "")}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, secret }),
      // Cold start (Space waking up) plus CPU inference can genuinely take
      // a couple of minutes worst-case — this is the one call in the app
      // meant to wait that long.
      signal: AbortSignal.timeout(150_000),
    });
  } catch {
    return NextResponse.json({ error: "The avatar generator isn't responding right now" }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "The avatar generator couldn't create an image" }, { status: 502 });
  }

  const data = (await response.json().catch(() => null)) as { image_base64?: string } | null;
  if (!data?.image_base64) {
    return NextResponse.json({ error: "The avatar generator returned an unexpected response" }, { status: 502 });
  }

  return NextResponse.json({ dataUrl: `data:image/png;base64,${data.image_base64}` });
}
