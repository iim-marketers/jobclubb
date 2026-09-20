import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Header/footer live here, not in pages: a layout persists across navigation,
// so nav hover states don't replay on every route change.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
