import Image from "next/image";
import splashLogo from "@/images/splash-logo.png";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { HomeIcon } from "@/components/shared/Icons";

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <Image src={splashLogo} alt="Movie Madness Bracket" width={160} priority />
        <h1 className="font-display text-3xl tracking-wide text-gold uppercase">About this bracket</h1>
      </div>

      <p className="text-cream-dim">
        This app started as a way to settle a debate about which Tom Cruise movie is actually the best —
        so we built an NCAA-tournament-style bracket to argue it out properly.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-xl tracking-wide text-rose uppercase">How a bracket works, start to finish</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-cream-dim">
          <li>
            <strong className="text-gold">Nominate</strong> — everyone adds
            movies to the pool, either by submitting a few picks whenever they want (open nominations) or
            by taking turns in a live draft.
          </li>
          <li>
            <strong className="text-gold">Seed</strong> — once the pool is
            locked, everyone rates each movie 1-5. The averages set the seeds, so favorites are spread
            apart and don&apos;t face off too early.
          </li>
          <li>
            <strong className="text-gold">Vote</strong> — each round, movies
            face off head-to-head. Everyone scores both movies across a few categories (1-5 each). Scores
            are combined across all voters — individual votes are never shown, only the totals.
          </li>
          <li>
            <strong className="text-gold">Ties</strong> — if the totals tie,
            the designated tiebreaker category decides it. If that&apos;s also tied, the host flips a coin
            or reopens the matchup for a revote.
          </li>
          <li>
            <strong className="text-gold">Repeat</strong> — the host closes
            each round once everyone&apos;s voted, and the bracket advances until one movie is left
            standing.
          </li>
        </ol>
      </section>

      <p className="text-sm text-cream-dim">
        Project the <code className="rounded bg-surface px-1 text-gold">/tv</code> page on a
        TV during voting — it shows the live bracket, nomination pool, or seeding leaderboard depending on
        what phase the bracket is in.
      </p>

      <BottomTabBar links={[{ href: "/", label: "Home", icon: <HomeIcon className="h-5 w-5" /> }]} />
    </main>
  );
}
