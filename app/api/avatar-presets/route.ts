import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPersonId } from "@/lib/person-session";
import { isPromptSafe } from "@/lib/avatar-prompts";

export const dynamic = "force-dynamic";

// A voter's own saved theme/palette/style presets — Person-scoped, so
// this returns [] rather than 401 for GET (no custom presets isn't an
// error, it's the default state for every unlinked voter and every
// linked one who hasn't made any yet).
const CATEGORIES = ["THEME", "PALETTE", "STYLE"] as const;
type Category = (typeof CATEGORIES)[number];

// Soft cap, same spirit as the existing prompt blocklist — a
// good-enough guard for a small trusted group, not abuse-hardened.
const MAX_PRESETS_PER_PERSON = 12;

export async function GET() {
  const personId = await getPersonId();
  if (!personId) return NextResponse.json({ presets: [] });

  const presets = await prisma.customAvatarPreset.findMany({
    where: { personId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ presets });
}

export async function POST(request: Request) {
  const personId = await getPersonId();
  if (!personId) {
    return NextResponse.json({ error: "You need to add your email above first" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { category, label, promptFragment, emoji, swatch } = body as Record<string, unknown>;
  if (typeof category !== "string" || !CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const trimmedLabel = typeof label === "string" ? label.trim().slice(0, 30) : "";
  const trimmedFragment = typeof promptFragment === "string" ? promptFragment.trim().slice(0, 150) : "";
  if (!trimmedLabel || !trimmedFragment) {
    return NextResponse.json({ error: "Give it a name and a short description" }, { status: 400 });
  }
  if (!isPromptSafe(trimmedLabel) || !isPromptSafe(trimmedFragment)) {
    return NextResponse.json({ error: "That isn't allowed — try describing it differently" }, { status: 400 });
  }

  const count = await prisma.customAvatarPreset.count({ where: { personId } });
  if (count >= MAX_PRESETS_PER_PERSON) {
    return NextResponse.json({ error: `You can save up to ${MAX_PRESETS_PER_PERSON} custom presets` }, { status: 400 });
  }

  const preset = await prisma.customAvatarPreset.create({
    data: {
      personId,
      category: category as Category,
      label: trimmedLabel,
      promptFragment: trimmedFragment,
      emoji: typeof emoji === "string" ? emoji.slice(0, 8) : null,
      swatch: typeof swatch === "string" ? swatch.slice(0, 100) : null,
    },
  });
  return NextResponse.json({ preset });
}
