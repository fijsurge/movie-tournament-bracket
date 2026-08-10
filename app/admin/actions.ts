"use server";

import { redirect } from "next/navigation";
import { clearAdminCookie } from "@/lib/admin-auth";

export async function logoutAdmin(): Promise<void> {
  await clearAdminCookie();
  redirect("/");
}
