import { logoutAdmin } from "@/app/admin/actions";
import { PageNav } from "@/components/shared/PageNav";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { HomeIcon, LogOutIcon, TrophyIcon } from "@/components/shared/Icons";

// bracketSlug is only known on the per-bracket admin dashboard — the global
// brackets list and the new-bracket form have no specific bracket to link
// back to, so they render this with no "View bracket" tab.
export function AdminNav({ bracketSlug }: { bracketSlug?: string } = {}) {
  return (
    <PageNav
      backHref="/admin"
      backLabel="All brackets"
      links={[
        ...(bracketSlug ? [{ href: `/b/${bracketSlug}`, label: "View bracket", icon: TrophyIcon }] : []),
        { href: "/", label: "Home", icon: HomeIcon },
      ]}
      action={
        <form action={logoutAdmin}>
          <SubmitButton
            pendingLabel="…"
            className="flex items-center gap-1.5 text-cream-dim transition hover:text-gold active:scale-95"
          >
            <LogOutIcon className="h-4 w-4" /> Log out
          </SubmitButton>
        </form>
      }
    />
  );
}
