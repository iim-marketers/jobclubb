import { FranchiseShell } from "@/components/franchise/franchise-shell";
import { requireFranchise } from "@/server/franchises/current";

export const metadata = { title: "Franchise dashboard — JobClubb" };

export default async function FranchiseLayout({ children }: LayoutProps<"/franchise/dashboard">) {
  const franchise = await requireFranchise();

  return (
    <FranchiseShell
      franchise={{
        name: franchise.name,
        code: franchise.code,
        email: franchise.email,
        status: franchise.status,
      }}
    >
      <main className="flex-1 px-4 py-6 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </FranchiseShell>
  );
}
