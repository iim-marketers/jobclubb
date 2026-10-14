import Link from "next/link";
import { Mail, Phone, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Franchise sign-up — JobClubb",
  description:
    "Franchise partner accounts on JobClubb are coming soon.",
  robots: { index: false, follow: true },
};

export default function FranchiseSignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Store className="size-6" />
        </span>
        <p className="mt-5 font-head text-xs font-bold tracking-[0.14em] text-brand uppercase">
          Coming soon
        </p>
        <h1 className="mt-2 font-head text-2xl font-extrabold tracking-tight">
          Franchise accounts are on the way
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We&apos;re getting franchise sign-up and sign-in ready. Interested in
          partnering with JobClubb? Get in touch and our team will walk you
          through the program.
        </p>

        <div className="mt-6 flex flex-col gap-2 text-sm sm:flex-row sm:justify-center sm:gap-6">
          <a
            href="mailto:support@jobclubb.com"
            className="inline-flex items-center justify-center gap-2 font-semibold text-brand hover:underline"
          >
            <Mail className="size-4" />
            support@jobclubb.com
          </a>
          <a
            href="tel:+917439922120"
            className="inline-flex items-center justify-center gap-2 font-semibold text-brand hover:underline"
          >
            <Phone className="size-4" />
            +91-7439922120
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Back to home
          </Button>
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/franchise" />}
          >
            About the franchise program
          </Button>
        </div>
      </div>
    </div>
  );
}
