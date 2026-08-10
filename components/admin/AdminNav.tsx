import { logoutAdmin } from "@/app/admin/actions";
import { PageNav } from "@/components/shared/PageNav";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { HomeIcon, LogOutIcon } from "@/components/shared/Icons";

export function AdminNav() {
  return (
    <PageNav
      backHref="/admin"
      backLabel="All brackets"
      links={[{ href: "/", label: "Home", icon: HomeIcon }]}
      action={
        <form action={logoutAdmin}>
          <SubmitButton
            pendingLabel="…"
            className="flex items-center gap-1.5 text-cream-dim transition hover:text-gold"
          >
            <LogOutIcon className="h-4 w-4" /> Log out
          </SubmitButton>
        </form>
      }
    />
  );
}
