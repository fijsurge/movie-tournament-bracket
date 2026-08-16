import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { NewBracketForm } from "@/components/admin/NewBracketForm";

export default async function NewBracketPage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <AdminNav />
      <h1 className="mb-6 font-display text-3xl tracking-wide text-gold uppercase">New bracket</h1>
      <NewBracketForm />
    </main>
  );
}
