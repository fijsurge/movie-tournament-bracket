"use server";

import { redirect } from "next/navigation";
import { getAdminPassword, setAdminCookie } from "@/lib/admin-auth";
import { safeNextPath } from "@/lib/safe-redirect";

export interface LoginState {
  error: string | null;
}

export async function loginAdmin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (password !== getAdminPassword()) {
    return { error: "Incorrect password" };
  }

  await setAdminCookie();
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}
