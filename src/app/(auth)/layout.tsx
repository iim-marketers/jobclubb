import { SiteHeader } from "@/components/site-header";
import { redirectIfCandidate } from "@/server/auth/current-candidate";
import { redirectIfCompany } from "@/server/auth/current-company";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  await redirectIfCandidate();
  await redirectIfCompany();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
