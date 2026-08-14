import Link from "next/link";
import { prisma } from "@/lib/db";
import { getPersonId } from "@/lib/person-session";
import { logoutPerson } from "@/app/login/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { PersonProfileForm } from "@/components/PersonProfileForm";
import { HomeIcon } from "@/components/shared/Icons";

export const dynamic = "force-dynamic";

const HOME_LINK = [{ href: "/", label: "Home", icon: <HomeIcon className="h-5 w-5" /> }];

export default async function AccountPage() {
  const personId = await getPersonId();
  const person = personId
    ? await prisma.person.findUnique({
        where: { id: personId },
        include: { voters: { include: { bracket: true } } },
      })
    : null;

  if (!person) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <h1 className="font-display text-2xl tracking-wide text-gold uppercase">My account</h1>
        <p className="text-sm text-cream-dim">Log in to see your account and the brackets you&apos;ve joined.</p>
        <Link
          href="/login?next=/account"
          className="self-start rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95"
        >
          Log in
        </Link>
        <BottomTabBar links={HOME_LINK} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <h1 className="font-display text-2xl tracking-wide text-gold uppercase">My account</h1>

      <div>
        <p className="text-sm text-cream-dim">{person.email}</p>
      </div>

      <PersonProfileForm currentName={person.name} currentAvatar={person.avatar} />

      <section>
        <h2 className="text-lg font-medium text-rose">My brackets</h2>
        {person.voters.length === 0 ? (
          <p className="mt-2 text-sm text-cream-dim">You haven&apos;t joined any brackets yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {person.voters.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/b/${v.bracket.slug}`}
                  className="flex items-center justify-between rounded-lg border border-gold/15 bg-surface p-3 transition hover:border-gold/40 active:scale-[0.99]"
                >
                  <span className="truncate">{v.bracket.name}</span>
                  <StatusBadge status={v.bracket.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={logoutPerson}>
        <SubmitButton
          pendingLabel="…"
          className="self-start rounded-full border border-gold/40 px-4 py-2 text-sm text-cream transition hover:border-gold active:scale-95"
        >
          Log out
        </SubmitButton>
      </form>

      <BottomTabBar links={HOME_LINK} />
    </main>
  );
}
