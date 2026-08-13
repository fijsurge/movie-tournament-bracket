import { PageNav } from "@/components/shared/PageNav";
import { TvIcon, HomeIcon, SettingsIcon, AccountIcon } from "@/components/shared/Icons";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { QuickActionsButton } from "@/components/admin/QuickActionsButton";

export async function BracketNav({ slug, bracketName }: { slug: string; bracketName: string }) {
  const isAdmin = await isAdminAuthenticated();

  return (
    <>
      <PageNav
        backHref={`/b/${slug}`}
        backLabel={bracketName}
        links={[
          { href: `/b/${slug}/tv`, label: "TV view", icon: TvIcon },
          { href: `/b/${slug}/account`, label: "My account", icon: AccountIcon },
          {
            href: isAdmin ? `/admin/brackets/${slug}` : `/admin/login?next=/admin/brackets/${slug}`,
            label: "Admin",
            icon: SettingsIcon,
            accent: isAdmin,
          },
          { href: "/", label: "Home", icon: HomeIcon },
        ]}
      />
      <QuickActionsButton slug={slug} />
    </>
  );
}
