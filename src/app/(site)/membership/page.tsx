import Link from "next/link";
import { BadgeCheck, Check, Info, Lock, Share2 } from "lucide-react";

import { PageHeader, Section, SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { PLAN_DETAILS, type MembershipPlan } from "@/lib/membership";
import {
  CHECKOUT_PATH,
  getMembershipView,
  type MembershipView,
} from "@/server/auth/current-candidate";

export const metadata = {
  title: "Membership — JobClubb",
  description:
    "Unlock the full job board, one-click apply, guaranteed interviews and upskilling.",
};

const MEMBER_BENEFITS = [
  "Unlock all live jobs",
  "Unlimited one-click apply",
  "Guaranteed employer interviews",
  "Full upskilling & certification access",
  "AI-generated, ATS-approved resume",
  "Location match — jobs near your home",
  "Priority support till you're hired",
];

const JOIN_STEPS = [
  "Create your account",
  "Verify your email",
  "Pay for your membership",
  "Start applying to verified employers",
];

type Viewer = MembershipView;

export default async function MembershipPage() {
  const viewer = await getMembershipView();
  const plan = viewer.kind === "guest" ? "member" : viewer.plan;

  return (
    <>
      <PageHeader
        eyebrow="Why JobClubb membership"
        title={
          viewer.kind === "guest"
            ? "Your days of job searching are over"
            : "Your membership"
        }
        description={
          viewer.kind === "guest"
            ? "One membership unlocks the full board, one-click apply, guaranteed interviews and upskilling."
            : "Everything included in your JobClubb membership, and how long it lasts."
        }
      >
        {viewer.kind !== "guest" && <MembershipBanner viewer={viewer} />}
      </PageHeader>

      <Section>
        <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-2">
          <PlanCard plan={plan} viewer={viewer}>
            <ul className="space-y-2.5">
              {MEMBER_BENEFITS.map((b) => (
                <Feature key={b}>{b}</Feature>
              ))}
            </ul>
            {viewer.kind !== "guest" && viewer.plan === "franchise" && (
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Franchise price for candidates who joined with code{" "}
                <span className="font-mono font-semibold whitespace-nowrap text-foreground">
                  {viewer.code}
                </span>
                .
              </p>
            )}
          </PlanCard>

          <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
            <h3 className="font-head text-lg font-bold tracking-tight">
              How joining works
            </h3>
            <ol className="mt-6 flex-1 space-y-5">
              {JOIN_STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand/10 font-head text-sm font-extrabold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Paid securely via Razorpay. Membership lasts a year, with a
              renewal reminder 15 days before it ends.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-8">
          <div className="flex flex-wrap items-start gap-5">
            <span className="flex size-12 flex-none items-center justify-center rounded-2xl bg-brand-accent/15 text-good">
              <Share2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <SectionEyebrow>Refer &amp; earn</SectionEyebrow>
              <h2 className="mt-1.5 font-head text-xl font-bold tracking-tight">
                Every paying member gets a unique referral code
              </h2>
              <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                Share your code and the first 5 people who join with it receive
                free membership. Those 5 free members don&apos;t receive their
                own shareable code — the referral chain stops there.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <code className="rounded-lg border border-dashed border-brand/40 bg-muted px-4 py-2 font-mono text-sm font-semibold text-brand">
                  JC-JOIN-XXXX
                </code>
                <span className="text-sm text-muted-foreground">
                  0 of 5 redemptions used
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-card">
        <SectionEyebrow>Why upskilling</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight">
          Getting shortlisted is a skill of its own
        </h2>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Airlines, hotels and travel employers hire on grooming, communication
          and service instinct — not just qualifications. Upskilling is included
          with every membership so you walk into the interview prepared.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Interview coaching",
              body: "Mock rounds modelled on real airline and hotel selection formats, including group discussions.",
            },
            {
              title: "Grooming & presentation",
              body: "The appearance and etiquette standards that cabin crew and front-office panels actually assess.",
            },
            {
              title: "Communication",
              body: "Spoken English and guest-handling practice pitched at service-industry expectations.",
            },
            {
              title: "Certification",
              body: "Sector certifications that make your profile stand out to hiring managers.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <h3 className="font-head font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="flex flex-row items-center gap-2">
              <Lock className="size-5 text-brand" />
              <h2 className="font-head text-xl font-bold tracking-tight">
                What members unlock
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {MEMBER_BENEFITS.map((b) => (
                <Feature key={b}>{b}</Feature>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="flex flex-row items-center gap-2">
              <Info className="size-5 text-brand" />
              <h2 className="font-head text-xl font-bold tracking-tight">
                How renewal works
              </h2>
            </div>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
              <li>
                <span className="font-head font-bold text-foreground">
                  15 days before expiry
                </span>{" "}
                — we send a renewal reminder by email, SMS and in-app
                notification, with an option to update your resume in the same
                flow.
              </li>
              <li>
                <span className="font-head font-bold text-foreground">
                  Closer to expiry
                </span>{" "}
                — a second reminder goes out so nothing lapses by accident.
              </li>
              <li>
                <span className="font-head font-bold text-foreground">
                  If it lapses
                </span>{" "}
                — your profile is kept safe, and job access resumes as soon as
                you renew.
              </li>
            </ul>
          </div>
        </div>

        {/* <div className="mt-8 text-center">
          <Button
            className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            Become a Member
          </Button>
        </div> */}
      </Section>
    </>
  );
}

function MembershipBanner({
  viewer,
}: {
  viewer: Exclude<Viewer, { kind: "guest" }>;
}) {
  const details = PLAN_DETAILS[viewer.plan];
  const member = viewer.kind === "member";

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <span className="flex size-12 flex-none items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <BadgeCheck className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Your plan</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="font-head text-xl font-bold tracking-tight">
            {details.name}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 font-head text-xs font-bold ${
              member
                ? "bg-good/15 text-good"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            }`}
          >
            {member ? "Active" : "Payment pending"}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {member
            ? `Valid till ${viewer.validUntil} · ${viewer.daysLeft} days left`
            : `${details.price} / year · pay to unlock jobs and applying`}
        </p>
      </div>
      <Button
        className={`font-head ${
          member ? "" : "bg-brand text-brand-foreground hover:bg-brand-dark"
        }`}
        variant={member ? "outline" : "default"}
        nativeButton={false}
        render={<Link href={member ? "/candidate/dashboard" : CHECKOUT_PATH} />}
      >
        {member ? "Go to dashboard" : "Complete payment"}
      </Button>
    </div>
  );
}

function PlanCard({
  plan,
  viewer,
  children,
}: {
  plan: MembershipPlan;
  viewer: Viewer;
  children: React.ReactNode;
}) {
  const details = PLAN_DETAILS[plan];
  const action = {
    guest: { label: "Join JobClubb", href: "/sign-up" },
    unpaid: { label: `Pay ${details.price}`, href: CHECKOUT_PATH },
    member: { label: "Go to dashboard", href: "/candidate/dashboard" },
  }[viewer.kind];

  return (
    <div className="relative flex h-full flex-col rounded-3xl border border-brand bg-card p-8 shadow-lg ring-1 ring-brand">
      <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 font-head text-xs font-bold text-brand-foreground">
        {viewer.kind === "member" && (
          <Check className="size-3" strokeWidth={3} />
        )}
        {viewer.kind === "member" ? "Your plan" : "Membership"}
      </span>
      <h3 className="font-head text-lg font-bold tracking-tight">
        {details.name}
      </h3>
      <p className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="font-head text-4xl font-extrabold tracking-tight text-brand">
          {details.price}
        </span>
        <span className="text-sm text-muted-foreground">/ year</span>
      </p>
      <div className="mt-6 flex-1">{children}</div>
      <Button
        className="mt-7 w-full shrink-0 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
        nativeButton={false}
        render={<Link href={action.href} />}
      >
        {action.label}
      </Button>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Check className="mt-0.5 size-4 flex-none text-good" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
