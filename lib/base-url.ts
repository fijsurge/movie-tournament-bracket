import "server-only";
import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  const store = await headers();
  // On Vercel (and behind most reverse proxies) the `host` header seen by the
  // function can be an internal one — `x-forwarded-host` carries the real
  // client-facing domain and must be checked first, or invite links end up
  // pointing at localhost in production.
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "localhost:3000";
  const proto = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
