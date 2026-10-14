import { CompaniesTable } from "@/components/admin/companies-table";
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
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">
          Companies
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every company registers with its own company email and is verified
          once it confirms that address.
        </p>
      </div>
      <CompaniesTable
        companies={companies}
        initialCompanyId={typeof company === "string" ? company : undefined}
      />
    </div>
  );
}
