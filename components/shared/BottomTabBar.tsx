"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The primary nav surface — fixed to the bottom so every destination is a
// thumb-stretch away, rather than the old sticky-top row. Labels are always
// shown (icon-above-label, not the old icon-only-below-sm trick) since a
// bottom bar has the vertical room for both.
//
// `icon` is a pre-rendered node, not a component reference: this is a client
// component, and passing a bare component/function down from the server
// PageNav that renders it isn't serializable across that boundary — PageNav
// renders each icon into JSX itself before handing the array down.
export function BottomTabBar({
  links,
}: {
  links: { href: string; label: string; icon?: ReactNode; accent?: boolean }[];
}) {
  const pathname = usePathname();

  return (
    <nav
      data-bottom-tab-bar
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gold/20 bg-ink/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition active:scale-95 ${
              active ? "text-gold" : "text-cream-dim hover:text-gold"
            }`}
          >
            <span className={l.accent ? "text-gold" : undefined}>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
