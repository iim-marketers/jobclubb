import { redirect } from "next/navigation";

import { AdminLogin } from "@/components/admin/admin-login";
import { ADMIN_HOME, isAdmin } from "@/server/admin/session";

export const metadata = {
  title: "Admin sign in — JobClubb",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect(ADMIN_HOME);
  return <AdminLogin />;
}
