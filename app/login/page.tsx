import Link from "next/link";
import { redirect } from "next/navigation";
import { getPersonId } from "@/lib/person-session";
import { safeNextPath } from "@/lib/safe-redirect";
import { LoginEmailForm } from "@/components/LoginEmailForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string }>;
}) {
  const { next, sent } = await searchParams;
  const safeNext = safeNextPath(next, "/");

  if (await getPersonId()) {
    redirect(safeNext);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-display text-3xl tracking-wide text-gold uppercase">Log in</h1>
      {sent === "1" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-cream-dim">
            Check your email for a login link — it works once and expires in 30 minutes.
          </p>
          <Link href="/login" className="text-sm text-gold underline underline-offset-2">
            Use a different email
          </Link>
        </div>
      ) : (
        <LoginEmailForm next={safeNext} />
      )}
    </main>
  );
}
