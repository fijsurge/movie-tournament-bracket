"use server";

import { redirect } from "next/navigation";
import { getAdminPassword, setAdminCookie } from "@/lib/admin-auth";

export interface LoginState {
  error: string | null;
}

export async function loginAdmin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (password !== getAdminPassword()) {
    return { error: "Incorrect password" };
  }

  await setAdminCookie();
  redirect("/admin/brackets/new");
}
