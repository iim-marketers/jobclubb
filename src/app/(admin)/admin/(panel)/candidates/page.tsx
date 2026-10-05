import { CandidatesTable, type AdminCandidate } from "@/components/admin/candidates-table";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin/session";

export const metadata = { title: "Candidates — JobClubb admin" };

export default async function AdminCandidatesPage() {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("candidates")
    .select(
      "id, first_name, last_name, email, phone, city, vertical, membership_plan, membership_expires_at, email_verified_at, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  const candidates: AdminCandidate[] = data.map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    email: c.email,
    phone: c.phone,
    city: c.city,
    vertical: c.vertical,
    plan: c.membership_plan,
    membershipExpiresAt: c.membership_expires_at,
    emailVerified: c.email_verified_at !== null,
    createdAt: c.created_at,
  }));

  return (
    <div className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">Candidates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone who has registered as a candidate, newest first.
        </p>
      </div>
      <CandidatesTable candidates={candidates} />
    </div>
  );
}
