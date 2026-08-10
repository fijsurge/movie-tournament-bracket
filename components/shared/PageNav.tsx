import Link from "next/link";
import type { ReactNode } from "react";

export function PageNav({
  backHref,
  backLabel,
  links = [],
  action,
}: {
  backHref: string;
  backLabel: string;
  links?: { href: string; label: string }[];
  action?: ReactNode;
}) {
  return (
    <nav className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-6 py-3 text-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="flex min-w-0 gap-4">
        <Link href={backHref} className="truncate underline">
          ← {backLabel}
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 text-neutral-500 underline">
            {l.label}
          </Link>
        ))}
      </div>
      {action}
    </nav>
  );
}
