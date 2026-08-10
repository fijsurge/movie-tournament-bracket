import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">About this bracket</h1>

      <p className="text-neutral-600 dark:text-neutral-400">
        This app started as a way to settle a debate about which Tom Cruise movie is actually the best —
        so we built an NCAA-tournament-style bracket to argue it out properly.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">How a bracket works, start to finish</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-neutral-600 dark:text-neutral-400">
          <li>
            <strong className="text-neutral-900 dark:text-neutral-100">Nominate</strong> — everyone adds
            movies to the pool, either by submitting a few picks whenever they want (open nominations) or
            by taking turns in a live draft.
          </li>
          <li>
            <strong className="text-neutral-900 dark:text-neutral-100">Seed</strong> — once the pool is
            locked, everyone rates each movie 1-5. The averages set the seeds, so favorites are spread
            apart and don&apos;t face off too early.
          </li>
          <li>
            <strong className="text-neutral-900 dark:text-neutral-100">Vote</strong> — each round, movies
            face off head-to-head. Everyone scores both movies across a few categories (1-5 each). Scores
            are combined across all voters — individual votes are never shown, only the totals.
          </li>
          <li>
            <strong className="text-neutral-900 dark:text-neutral-100">Ties</strong> — if the totals tie,
            the designated tiebreaker category decides it. If that&apos;s also tied, the host flips a coin
            or reopens the matchup for a revote.
          </li>
          <li>
            <strong className="text-neutral-900 dark:text-neutral-100">Repeat</strong> — the host closes
            each round once everyone&apos;s voted, and the bracket advances until one movie is left
            standing.
          </li>
        </ol>
      </section>

      <p className="text-sm text-neutral-500">
        Project the <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">/tv</code> page on a
        TV during voting — it shows the live bracket, nomination pool, or seeding leaderboard depending on
        what phase the bracket is in.
      </p>

      <Link href="/" className="text-sm underline">
        ← Back home
      </Link>
    </main>
  );
}
