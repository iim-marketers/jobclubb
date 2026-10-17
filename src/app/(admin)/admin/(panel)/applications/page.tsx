import { ScreeningTable } from "@/components/admin/screening-table";
import { requireAdmin } from "@/server/admin/session";
import { listScreeningApplications } from "@/server/applications/screening";

export const metadata = { title: "Applications — JobClubb admin" };

export default async function AdminApplicationsPage() {
  await requireAdmin();
  const applications = await listScreeningApplications();

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">
          Applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every application comes to JobClubb first. Screen it, run the
          first-round interview, shortlist, then refer the candidate to the
          employer. Employers only see candidates you refer.
        </p>
      </div>
      <ScreeningTable applications={applications} />
    </div>
  );
}
