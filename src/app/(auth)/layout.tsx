import { SiteHeader } from "@/components/site-header";
import { redirectIfCandidate } from "@/server/auth/current-candidate";
import { redirectIfCompany } from "@/server/auth/current-company";
import { redirectIfFranchise } from "@/server/franchises/current";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  await Promise.all([redirectIfCandidate(), redirectIfCompany(), redirectIfFranchise()]);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
