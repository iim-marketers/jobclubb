import { SiteHeader } from "@/components/site-header";
import { redirectIfCandidate } from "@/server/auth/current-candidate";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  await redirectIfCandidate();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
