import { CompaniesTable } from "@/components/admin/companies-table";
import { listCompanies } from "@/server/admin/companies";
import { requireAdmin } from "@/server/admin/session";

export const metadata = { title: "Companies — JobClubb admin" };

export default async function AdminCompaniesPage() {
  await requireAdmin();
  const companies = await listCompanies();

  return (
    <div className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review registrations and decide who can sign in. Corporate-email companies verify
          automatically; free-mail or mismatched-domain sign-ups wait here for manual review.
        </p>
      </div>
      <CompaniesTable companies={companies} />
    </div>
  );
}
