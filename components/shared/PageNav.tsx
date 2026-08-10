import Link from "next/link";
import Image from "next/image";
import type { ComponentType, ReactNode, SVGProps } from "react";
import iconMark from "@/images/icon-mark.png";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function PageNav({
  backHref,
  backLabel,
  links = [],
  action,
}: {
  backHref: string;
  backLabel: string;
  links?: { href: string; label: string; icon?: IconType }[];
  action?: ReactNode;
}) {
  return (
    <nav className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-3 border-b border-gold/20 bg-ink/95 px-6 py-2.5 text-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-5">
        <Link href={backHref} className="flex min-w-0 items-center gap-2 font-medium text-gold">
          <Image src={iconMark} alt="" width={26} className="shrink-0" />
          <span className="truncate">{backLabel}</span>
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex shrink-0 items-center gap-1.5 text-cream-dim transition hover:text-gold"
          >
            {l.icon && <l.icon className="h-4 w-4" />}
            {l.label}
          </Link>
        ))}
      </div>
      {action}
    </nav>
  );
}
