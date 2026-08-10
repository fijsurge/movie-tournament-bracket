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
    <nav className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-3 border-b border-gold/20 bg-ink/95 px-6 py-3 text-sm backdrop-blur">
      <div className="flex min-w-0 gap-4">
        <Link href={backHref} className="truncate font-medium text-gold underline underline-offset-2">
          ← {backLabel}
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 text-cream-dim underline underline-offset-2">
            {l.label}
          </Link>
        ))}
      </div>
      {action}
    </nav>
  );
}
