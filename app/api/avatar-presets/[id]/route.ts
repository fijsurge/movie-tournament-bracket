import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPersonId } from "@/lib/person-session";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const personId = await getPersonId();
  if (!personId) {
    return NextResponse.json({ error: "You need to add your email above first" }, { status: 401 });
  }

  const { id } = await params;
  const preset = await prisma.customAvatarPreset.findUnique({ where: { id } });
  if (!preset || preset.personId !== personId) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  await prisma.customAvatarPreset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
