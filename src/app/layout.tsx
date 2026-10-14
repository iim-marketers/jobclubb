import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { CookieConsent } from "@/components/cookie-consent";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/site-url";
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
  metadataBase: new URL(SITE_URL),
  title: "JobClubb — Find your dream job",
  description:
    "India-first recruitment and career-membership platform: verified employers, guided applications, and membership benefits.",
  applicationName: "JobClubb",
  keywords: [
    "job clubb",
    "job search",
    "job portal",
    "job board",
    "job listings",
    "career platform",
    "career membership",
    "jobs in India",
    "airline jobs",
    "cabin crew jobs",
    "ground staff jobs",
    "hotel jobs",
    "hospitality jobs",
    "travel and tourism jobs",
    "verified employers",
    "JobClubb",
  ],
  openGraph: {
    type: "website",
    siteName: "JobClubb",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
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
        <Toaster position="bottom-right" />
        <CookieConsent />
      </body>
    </html>
  );
}
