import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PartnerCompanyForm } from "@/components/admin/partner-company-form";
import { requireAdmin } from "@/server/admin/session";

export const metadata = { title: "Add partner company — JobClubb admin" };

export default async function NewPartnerCompanyPage() {
  await requireAdmin();

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div>
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All companies
        </Link>
        <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">
          Add partner company
        </h1>
        <p className="mt-1 max-w-5xl text-sm text-muted-foreground">
          For companies with a tie-up with JobClubb. They aren&apos;t tied to
          one property, so their jobs can be posted in any city. Anyone who
          signs in with these details can post jobs for the company.
        </p>
      </div>
      <PartnerCompanyForm />
    </div>
  );
}
