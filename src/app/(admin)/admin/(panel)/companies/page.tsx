import Link from "next/link";
import { Plus } from "lucide-react";

import { CompaniesTable } from "@/components/admin/companies-table";
import { Button } from "@/components/ui/button";
import { listCompanies } from "@/server/admin/companies";
import { requireAdmin } from "@/server/admin/session";

export const metadata = { title: "Companies — JobClubb admin" };

export default async function AdminCompaniesPage({
  searchParams,
}: PageProps<"/admin/companies">) {
  await requireAdmin();
  const [companies, { company }] = await Promise.all([listCompanies(), searchParams]);

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-head text-2xl font-extrabold tracking-tight">
            Companies
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Properties register with their own company email and are verified
            once they confirm it. Partner companies are added here by the team.
          </p>
        </div>
        <Button
          className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          nativeButton={false}
          render={<Link href="/admin/companies/new" />}
        >
          <Plus className="size-4" />
          Add partner company
        </Button>
      </div>
      <CompaniesTable
        companies={companies}
        initialCompanyId={typeof company === "string" ? company : undefined}
      />
    </div>
  );
}
