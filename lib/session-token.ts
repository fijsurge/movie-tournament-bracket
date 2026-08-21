import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Pure HMAC signing for the person_id session cookie — no next/headers
// dependency, so this is usable both from lib/person-session.ts (Server
// Components/Actions, via the cookies() API) and from proxy.ts (Proxy runs
// outside that pipeline entirely, using NextRequest/NextResponse's own
// cookie APIs instead). Keeping the signing logic in one place means both
// call sites produce/verify cookies identically rather than risking two
// implementations drifting apart.

export const PERSON_COOKIE_NAME = "person_id";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

export function signPersonSession(personId: string, sessionVersion: number): string {
  const payload = `${personId}.${sessionVersion}`;
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export function verifyPersonSession(cookieValue: string): { personId: string; sessionVersion: number } | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [personId, versionStr, hmac] = parts;
  const sessionVersion = Number(versionStr);
  if (!personId || Number.isNaN(sessionVersion)) return null;

  const expected = createHmac("sha256", getSecret()).update(`${personId}.${sessionVersion}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(hmac, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) return null;

  return { personId, sessionVersion };
}
