import { PlacementsTable } from "@/components/admin/placements-table";
import { requireAdmin } from "@/server/admin/session";
import { listAdminPlacements } from "@/server/placements/placements";

export const metadata = { title: "Placements — JobClubb admin" };

export default async function AdminPlacementsPage() {
  await requireAdmin();
  const placements = await listAdminPlacements();

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">
          Placements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every candidate a company has selected. Check the offer the company
          uploads, release it, and the candidate pays the placement fee to
          unlock it.
        </p>
      </div>
      <PlacementsTable placements={placements} />
    </div>
  );
}
