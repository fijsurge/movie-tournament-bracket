import Link from "next/link";
import Image from "next/image";
import type { ComponentType, ReactNode, SVGProps } from "react";
import iconMark from "@/images/icon-mark.png";
import { BottomTabBar } from "@/components/shared/BottomTabBar";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function PageNav({
  backHref,
  backLabel,
  links = [],
  action,
}: {
  backHref: string;
  backLabel: string;
  links?: { href: string; label: string; icon?: IconType; accent?: boolean }[];
  action?: ReactNode;
}) {
  return (
    <>
      <nav className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-2 border-b border-gold/20 bg-ink/95 px-4 py-2.5 text-sm backdrop-blur sm:px-6">
        <Link href={backHref} className="flex min-w-0 items-center gap-2 font-medium text-gold">
          <Image src={iconMark} alt="" width={26} className="shrink-0" />
          <span className="truncate">{backLabel}</span>
        </Link>
        {action}
      </nav>
      {links.length > 0 && (
        <BottomTabBar
          links={links.map((l) => ({
            href: l.href,
            label: l.label,
            accent: l.accent,
            icon: l.icon && <l.icon className="h-5 w-5" />,
          }))}
        />
      )}
    </>
  );
}
