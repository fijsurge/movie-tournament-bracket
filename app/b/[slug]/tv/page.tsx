import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TVView } from "@/components/bracket/TVView";

export default async function TvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bracket = await prisma.bracket.findUnique({ where: { slug } });
  if (!bracket) notFound();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 p-4 text-center">
        <h1 className="text-3xl font-semibold">{bracket.name}</h1>
      </header>
      <TVView slug={slug} />
    </div>
  );
}
