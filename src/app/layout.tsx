import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobClubb — Find your dream job",
  description:
    "India-first recruitment and career-membership platform: verified employers, guided applications, and membership benefits.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextTopLoader color="var(--brand)" height={3} showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
