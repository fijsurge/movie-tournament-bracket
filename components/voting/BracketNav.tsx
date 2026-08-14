import { PageNav } from "@/components/shared/PageNav";
import { TvIcon, HomeIcon, SettingsIcon, AccountIcon } from "@/components/shared/Icons";
import { isBracketAdmin } from "@/lib/bracket-auth";
import { QuickActionsButton } from "@/components/admin/QuickActionsButton";

export async function BracketNav({
  slug,
  bracketName,
  bracketId,
}: {
  slug: string;
  bracketName: string;
  bracketId: string;
}) {
  const isAdmin = await isBracketAdmin(bracketId);

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
