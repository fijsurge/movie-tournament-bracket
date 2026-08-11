import "server-only";
import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  const store = await headers();
  const host = store.get("host") ?? "localhost:3000";
  const proto = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
