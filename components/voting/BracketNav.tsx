import { PageNav } from "@/components/shared/PageNav";
import { TvIcon, HomeIcon } from "@/components/shared/Icons";

export function BracketNav({ slug, bracketName }: { slug: string; bracketName: string }) {
  return (
    <PageNav
      backHref={`/b/${slug}`}
      backLabel={bracketName}
      links={[
        { href: `/b/${slug}/tv`, label: "TV view", icon: TvIcon },
        { href: "/", label: "Home", icon: HomeIcon },
      ]}
    />
  );
}
