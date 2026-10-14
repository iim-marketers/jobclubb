import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
