import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { TVView } from "@/components/bracket/TVView";
import iconMark from "@/images/icon-mark.png";

export default async function TvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({ where: { slug } });
  if (!bracket) notFound();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink text-cream">
      <header className="flex items-center justify-center gap-3 border-b border-gold/20 p-4">
        <Image src={iconMark} alt="" width={40} priority />
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">{bracket.name}</h1>
      </header>
      <TVView slug={slug} />
    </div>
  );
}
