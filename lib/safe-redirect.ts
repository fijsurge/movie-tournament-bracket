// Only allow same-site relative paths as redirect targets, never an absolute
// URL or protocol-relative "//host" — both are open-redirect vectors since
// this value round-trips through a query param and a hidden form field.
export function safeNextPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
