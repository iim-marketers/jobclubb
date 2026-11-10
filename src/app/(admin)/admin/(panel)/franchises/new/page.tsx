import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FranchiseForm } from "@/components/admin/franchise-admin";
import { requireAdmin } from "@/server/admin/session";

export const metadata = { title: "Add franchise — JobClubb admin" };

export default async function NewFranchisePage() {
  await requireAdmin();

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div>
        <Link
          href="/admin/franchises"
          className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All franchises
        </Link>
        <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">Add franchise</h1>
        <p className="mt-1 max-w-5xl text-sm text-muted-foreground">
          Add a franchise once its agreement is signed. Copy the details from the agreement and its
          Schedule A. JobClubb generates the franchise&apos;s code, and the franchise signs in with
          the email and password you set here to register candidates.
        </p>
      </div>
      <FranchiseForm />
    </div>
  );
}
