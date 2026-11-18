import { cookies } from "next/headers";
import Link from "next/link";
import { MailCheck, Store } from "lucide-react";

import { CheckInbox } from "@/components/sign-up/check-inbox";
import { ResendConfirmation } from "@/components/sign-up/resend-confirmation";
import { Button } from "@/components/ui/button";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";

export async function generateMetadata({
  searchParams,
}: PageProps<"/sign-up/submitted">) {
  const { route } = await searchParams;
  return {
    title:
      route === "candidate"
        ? "Check your inbox — JobClubb"
        : "Registration received — JobClubb",
    robots: { index: false, follow: false },
  };
}

const CONTENT = {
  franchiseConfirmed: {
    icon: Store,
    iconClass: "bg-good/15 text-good",
    title: "Email confirmed: we're reviewing your application",
    body: "Thanks for signing up as a JobClubb franchise partner. Our team will call or email you about the franchise agreement and fee.",
    steps: [
      "Sign the franchise agreement and pay the ₹3,00,000 + GST franchise fee",
      "We approve your franchise and email you your franchise code",
      "Sign in as a franchise and start registering candidates",
    ],
  },
  franchise: {
    icon: Store,
    iconClass: "bg-good/15 text-good",
    title: "Check your inbox to confirm your email",
    body: "We've sent a confirmation link to your email. Once you've confirmed it, our team reviews your application and gets in touch about the franchise agreement.",
    steps: [
      "Click the confirmation link in the email from JobClubb",
      "Sign the franchise agreement and pay the ₹3,00,000 + GST franchise fee",
      "We approve your franchise and email you your code. Then sign in and start registering candidates",
    ],
  },
  email: {
    icon: MailCheck,
    iconClass: "bg-good/15 text-good",
    title: "Check your work inbox",
    body: "We've sent a confirmation link to your company email address. Click it within 24 hours to verify your company and activate your account.",
    steps: [
      "Open the email from JobClubb",
      "Click the confirmation link",
      "Sign in and post your first opening",
    ],
  },
};

export default async function SignUpSubmittedPage({
  searchParams,
}: PageProps<"/sign-up/submitted">) {
  const { route, membership, confirmed } = await searchParams;
  const pendingEmail = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value;
  if (route === "candidate")
    return (
      <CheckInbox
        email={pendingEmail}
        membershipIncluded={membership === "included"}
      />
    );

  const franchise = route === "franchise";
  const content = franchise
    ? confirmed === "1"
      ? CONTENT.franchiseConfirmed
      : CONTENT.franchise
    : CONTENT.email;
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

        <ol className="mt-6 space-y-3 rounded-2xl bg-muted/50 p-4 text-left">
          {content.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-6">
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-brand/10 font-head text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>

        {pendingEmail && confirmed !== "1" && (
          <ResendConfirmation email={pendingEmail} justSent className="mt-4" />
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
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
            render={
              <Link href={franchise ? "/franchise" : "/sign-in?as=company"} />
            }
          >
            {franchise ? "About the franchise program" : "Go to sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
