import Link from "next/link";
import { MailCheck, PartyPopper, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Registration received — JobClubb" };

const CONTENT = {
  candidate: {
    icon: PartyPopper,
    iconClass: "bg-good/15 text-good",
    title: "Welcome to JobClubb",
    body: "Your account is ready. We've emailed you a link to set your password and sign in.",
    steps: [
      "Set your password from the email we sent",
      "Build your AI-powered, ATS-ready resume",
      "Browse openings matched to your city",
    ],
  },
  email: {
    icon: MailCheck,
    iconClass: "bg-good/15 text-good",
    title: "Check your work inbox",
    body: "We've sent a confirmation link to your corporate email address. Click it within 24 hours to verify your company and activate your account.",
    steps: [
      "Open the email from JobClubb",
      "Click the confirmation link",
      "Sign in and post your first opening",
    ],
  },
  manual: {
    icon: UserCheck,
    iconClass: "bg-brand/15 text-brand",
    title: "Your company is under review",
    body: "Because you registered with a personal email address, our team will verify your company manually against your GSTIN or business document.",
    steps: [
      "We review your details — usually within 2 business days",
      "We may call you to confirm",
      "You'll get an email once your account is approved",
    ],
  },
};

export default async function CompanySignUpSubmittedPage({
  searchParams,
}: PageProps<"/sign-up/submitted">) {
  const { route } = await searchParams;
  const content =
    route === "candidate" || route === "manual" ? CONTENT[route] : CONTENT.email;
  const Icon = content.icon;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center">
        <span
          className={`mx-auto flex size-12 items-center justify-center rounded-full ${content.iconClass}`}
        >
          <Icon className="size-6" />
        </span>
        <h1 className="mt-5 font-head text-2xl font-extrabold tracking-tight">
          {content.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {content.body}
        </p>

        <ol className="mt-6 space-y-2.5 text-left">
          {content.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="flex size-5 flex-none items-center justify-center rounded-full bg-muted font-head text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>

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
            render={<Link href="/sign-in" />}
          >
            Go to sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
