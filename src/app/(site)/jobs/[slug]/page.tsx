import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Clock,
  IndianRupee,
  Lock,
  MapPin,
  Monitor,
} from "lucide-react";

import { CompanyAvatar } from "@/components/company-avatar";

import { Button } from "@/components/ui/button";
import { JOBS, getJob } from "@/lib/jobs-data";

export function generateStaticParams() {
  return JOBS.map((job) => ({ slug: job.slug }));
}

export default async function JobDetailPage({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) notFound();

  return (
    <>
      <div className="border-b border-border bg-linear-to-b from-muted/60 to-background px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-brand"
          >
            <ArrowLeft className="size-4" />
            All jobs
          </Link>

          <div className="mt-5 flex flex-wrap items-start gap-4">
            <CompanyAvatar name={job.company} className="size-14 text-base" />
            <div className="min-w-0 flex-1">
              <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
                {job.designation}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {job.company} · {job.vertical}
              </p>
            </div>
          </div>

          {/* SOP §3.3: only these four fields may show before payment */}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact icon={MapPin} label="Location" value={job.location} />
            <Fact icon={Briefcase} label="Experience" value={job.experience} />
            <Fact icon={IndianRupee} label="Salary range" value={job.salaryRange} />
            <Fact icon={Building2} label="Position" value={job.title} />
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Tag icon={Clock}>{job.jobType}</Tag>
            <Tag icon={Monitor}>{job.workMode}</Tag>
            <Tag>Posted {job.postedAgo}</Tag>
          </div>
        </div>
      </div>

      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_300px]">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <div aria-hidden className="space-y-6 p-7 blur-[6px] select-none">
              <Block title="About the role" body={job.description} />
              <ListBlock title="Responsibilities" items={job.responsibilities} />
              <ListBlock title="Requirements" items={job.requirements} />
              <ListBlock title="Benefits" items={job.benefits} />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 px-6 text-center backdrop-blur-[3px]">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg">
                <Lock className="size-6" />
              </span>
              <h2 className="mt-4 font-head text-xl font-bold tracking-tight">
                Full details are for members
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Free browsing shows position, location, experience and salary range.
                Become a member to read the full description and apply in one click.
              </p>
              <Button
                className="mt-5 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Become a Member to unlock
              </Button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-head font-bold tracking-tight">Apply directly</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                JobClubb is a direct application platform — your application goes
                straight to the employer, with no intermediaries.
              </p>
              <Button
                className="mt-4 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
                nativeButton={false}
                render={<Link href="/membership" />}
              >
                Unlock &amp; apply
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <h3 className="font-head text-sm font-bold tracking-tight">
                Your privacy
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Employers see only your skills and experience. Your name and contact
                details stay hidden until you choose to reveal them.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-1 font-head text-sm font-bold tracking-tight">{value}</dd>
    </div>
  );
}

function Tag({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="font-head text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-head text-lg font-bold tracking-tight">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-muted-foreground">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
