import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyCurrentTurn } from "@/lib/turn-notify";

// Vercel Cron (see vercel.json) hits this once a day. Hobby-tier cron jobs
// can't run more often than that, so STALE_HOURS is set comfortably under
// 24h — long enough that a turn which was just notified today doesn't get
// re-nudged on the same sweep, short enough that the daily job always picks
// up anything that's been sitting since yesterday.
const STALE_HOURS = 20;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const staleDrafts = await prisma.draftState.findMany({
    where: {
      bracket: { status: "NOMINATING", nominationMode: "DRAFT" },
      OR: [
        { turnNotifiedAt: null, updatedAt: { lt: staleThreshold } },
        { turnNotifiedAt: { lt: staleThreshold } },
      ],
    },
    select: { bracketId: true },
  });

  for (const draft of staleDrafts) {
    await notifyCurrentTurn(draft.bracketId);
  }

  return NextResponse.json({ remindersSent: staleDrafts.length });
}
