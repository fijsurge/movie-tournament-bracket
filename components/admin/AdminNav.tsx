import { logoutAdmin } from "@/app/admin/actions";
import { PageNav } from "@/components/shared/PageNav";

export function AdminNav() {
  return (
    <PageNav
      backHref="/admin"
      backLabel="All brackets"
      links={[{ href: "/", label: "Home" }]}
      action={
        <form action={logoutAdmin}>
          <button type="submit" className="text-cream-dim underline underline-offset-2">
            Log out
          </button>
        </form>
      }
    />
  );
}
