import { redirect } from "next/navigation";

import { ADMIN_HOME } from "@/server/admin/session";

export default function AdminIndex() {
  redirect(ADMIN_HOME);
}
