import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const brackets = await prisma.bracket.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Movie Tournament Bracket</h1>

      {brackets.length === 0 ? (
        <p className="text-neutral-500">No brackets yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {brackets.map((b) => (
            <li key={b.id}>
              <Link href={`/b/${b.slug}`} className="underline">
                {b.name}
              </Link>{" "}
              <span className="text-sm text-neutral-500">({b.status})</span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin/login" className="text-sm text-neutral-500 underline">
        Admin
      </Link>
    </main>
  );
}
