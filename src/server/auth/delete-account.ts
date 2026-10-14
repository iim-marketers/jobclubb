import "server-only";

import { redirect } from "next/navigation";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function deleteOwnAccount(user: {
  id: string;
  email: string;
}): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Deleting account failed", error);
    return { error: "We couldn't delete your account. Please try again." };
  }

  await admin.from("email_sends").delete().eq("email", user.email);
  await (await createClient()).auth.signOut({ scope: "local" });
  redirect("/");
}
