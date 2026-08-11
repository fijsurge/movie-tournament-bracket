import { PageNav } from "@/components/shared/PageNav";
import { TvIcon, HomeIcon, SettingsIcon } from "@/components/shared/Icons";

export function BracketNav({ slug, bracketName }: { slug: string; bracketName: string }) {
  return (
    <PageNav
      backHref={`/b/${slug}`}
      backLabel={bracketName}
      links={[
        { href: `/b/${slug}/tv`, label: "TV view", icon: TvIcon },
        { href: `/admin/login?next=/admin/brackets/${slug}`, label: "Admin", icon: SettingsIcon },
        { href: "/", label: "Home", icon: HomeIcon },
      ]}
    />
  );
}
