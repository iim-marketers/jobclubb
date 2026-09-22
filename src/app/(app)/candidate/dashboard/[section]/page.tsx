import Link from "next/link";
import { notFound } from "next/navigation";
import { Construction } from "lucide-react";

import { CANDIDATE_HOME, CANDIDATE_NAV } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";

const SECTIONS = CANDIDATE_NAV.flatMap((g) => g.items).filter((i) => i.href !== CANDIDATE_HOME);

function findSection(slug: string) {
  return SECTIONS.find((i) => i.href === `${CANDIDATE_HOME}/${slug}`);
}

export async function generateMetadata({ params }: PageProps<"/candidate/dashboard/[section]">) {
  const section = findSection((await params).section);
  return { title: `${section?.label ?? "Dashboard"} — JobClubb` };
}

export default async function CandidateSection({ params }: PageProps<"/candidate/dashboard/[section]">) {
  const section = findSection((await params).section);
  if (!section) notFound();
  const Icon = section.icon;

  return (
    <div className="space-y-6">
      <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">{section.label}</h1>
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon className="size-6" />
          <Construction className="absolute -right-1.5 -bottom-1.5 size-5 rounded-full bg-card p-0.5 text-brand-accent" />
        </span>
        <p className="mt-5 font-head text-lg font-bold tracking-tight">This page is on its way</p>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
          We&apos;re still building {section.label.toLowerCase()}. Your overview has the highlights for now.
        </p>
        <Button
          variant="outline"
          className="mt-6 font-head"
          nativeButton={false}
          render={<Link href={CANDIDATE_HOME} />}
        >
          Back to overview
        </Button>
      </div>
    </div>
  );
}
