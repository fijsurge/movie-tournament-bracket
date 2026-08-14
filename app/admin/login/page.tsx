import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next);

  if (await isAdminAuthenticated()) {
    redirect(safeNext);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="font-display text-3xl tracking-wide text-gold uppercase">Admin login</h1>
      <LoginForm next={safeNext} />
      <Link
        href={`/login?next=${encodeURIComponent(safeNext)}`}
        className="text-center text-sm text-gold underline underline-offset-2"
      >
        or log in with your account
      </Link>
    </main>
  );
}
