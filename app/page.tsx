import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import iconMark from "@/images/icon-mark.png";

export default async function Home() {
  const brackets = await prisma.bracket.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Image src={iconMark} alt="" width={48} priority />
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">Movie Madness Bracket</h1>
      </div>

      {brackets.length === 0 ? (
        <p className="text-cream-dim">No brackets yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {brackets.map((b) => (
            <li key={b.id}>
              <Link href={`/b/${b.slug}`} className="text-gold underline underline-offset-2">
                {b.name}
              </Link>{" "}
              <span className="text-sm text-cream-dim">({b.status})</span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin/login" className="text-sm text-cream-dim underline underline-offset-2">
        Admin
      </Link>
    </main>
  );
}
