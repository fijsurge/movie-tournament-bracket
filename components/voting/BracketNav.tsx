import { PageNav } from "@/components/shared/PageNav";

export function BracketNav({ slug, bracketName }: { slug: string; bracketName: string }) {
  return (
    <PageNav
      backHref={`/b/${slug}`}
      backLabel={bracketName}
      links={[
        { href: `/b/${slug}/tv`, label: "TV view" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
