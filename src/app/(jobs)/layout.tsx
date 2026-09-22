import { SiteHeader } from "@/components/site-header";

export default function JobsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
