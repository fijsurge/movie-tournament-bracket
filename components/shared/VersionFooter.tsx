import Link from "next/link";
import packageJson from "@/package.json";

export function VersionFooter() {
  return (
    <footer className="mt-auto flex justify-center gap-3 border-t border-gold/15 p-3 text-xs text-cream-dim">
      <span>v{packageJson.version}</span>
      <Link href="/about" className="text-gold underline underline-offset-2">
        About
      </Link>
    </footer>
  );
}
