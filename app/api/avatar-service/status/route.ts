import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cheap readiness check for the AI avatar generator's Cloud Run service
// (see avatar-service/README.md). Hitting a scaled-to-zero service's root
// is itself what triggers its cold start — no separate wake endpoint
// needed on the service side. A short timeout distinguishes "slow because
// it's cold-starting" from "down" without making the caller wait through
// a full cold start just to ask.
const READY_CHECK_TIMEOUT_MS = 3000;

export async function GET() {
  const serviceUrl = process.env.AVATAR_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json({ status: "not_configured" });
  }

  try {
    const res = await fetch(serviceUrl, { signal: AbortSignal.timeout(READY_CHECK_TIMEOUT_MS) });
    return NextResponse.json({ status: res.ok ? "ready" : "warming_up" });
  } catch {
    // Timeout or network error while the service is cold-starting — not a
    // failure, just not ready yet. The request above already triggered
    // the start regardless of whether we waited for it to finish.
    return NextResponse.json({ status: "warming_up" });
  }
}
