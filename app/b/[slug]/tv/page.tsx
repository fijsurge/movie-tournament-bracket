import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { TVView } from "@/components/bracket/TVView";
import { ArrowLeftIcon, HomeIcon } from "@/components/shared/Icons";
import iconMark from "@/images/icon-mark.png";

export const dynamic = "force-dynamic";

export default async function TvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({ where: { slug } });
  if (!bracket) notFound();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink text-cream">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-gold/20 px-4 py-3">
        <Link
          href={`/b/${slug}`}
          className="flex items-center gap-1.5 justify-self-start text-sm text-cream-dim transition hover:text-gold"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Bracket
        </Link>
        <div className="flex items-center gap-3 justify-self-center">
          <Image src={iconMark} alt="" width={40} priority />
          <h1 className="font-display text-3xl tracking-wide text-gold uppercase">{bracket.name}</h1>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 justify-self-end text-sm text-cream-dim transition hover:text-gold"
        >
          Home
          <HomeIcon className="h-4 w-4" />
        </Link>
      </header>
      <TVView slug={slug} />
    </div>
  );
}
