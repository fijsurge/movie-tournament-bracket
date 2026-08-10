import Link from "next/link";
import packageJson from "@/package.json";

export function VersionFooter() {
  return (
    <footer className="mt-auto flex justify-center gap-3 border-t border-neutral-200 p-3 text-xs text-neutral-400 dark:border-neutral-800">
      <span>v{packageJson.version}</span>
      <Link href="/about" className="underline">
        About
      </Link>
    </footer>
  );
}
