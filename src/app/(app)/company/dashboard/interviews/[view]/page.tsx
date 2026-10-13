import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, ChevronRight } from "lucide-react";

import { DashboardHeader, EmptyState } from "@/components/candidate/dashboard-ui";
import {
  INTERVIEW_VIEWS,
  InterviewStatusPill,
  MODE_ICONS,
  applicantInterviewHref,
  placeSummary,
  splitInterviews,
  type InterviewView,
} from "@/components/company/interview-list";
import { COMPANY_INTERVIEWS } from "@/components/company/nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIst } from "@/lib/interviews";
import { listCompanyInterviews } from "@/server/applications/company";
import { requireCompany } from "@/server/auth/current-company";

const isView = (view: string): view is InterviewView => view in INTERVIEW_VIEWS;

export async function generateMetadata({
  params,
}: PageProps<"/company/dashboard/interviews/[view]">) {
  const { view } = await params;
  return { title: `${isView(view) ? INTERVIEW_VIEWS[view].title : "Interviews"} — JobClubb` };
}

const HEAD = "h-11 px-3 text-xs font-semibold whitespace-nowrap text-muted-foreground";

export default async function InterviewViewPage({
  params,
}: PageProps<"/company/dashboard/interviews/[view]">) {
  const { view } = await params;
  if (!isView(view)) notFound();
  const company = await requireCompany(`${COMPANY_INTERVIEWS}/${view}`);
  const now = new Date();
  const interviews = splitInterviews(await listCompanyInterviews(company.id), now)[view];
  const { title, description, empty } = INTERVIEW_VIEWS[view];

  return (
    <div className="space-y-6">
      <Link
        href={COMPANY_INTERVIEWS}
        className="inline-flex items-center gap-1.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All interviews
      </Link>

      <DashboardHeader
        title={title}
        description={`${interviews.length} ${interviews.length === 1 ? "interview" : "interviews"}. ${description}`}
      />

      {interviews.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={empty} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD}>Applicant</TableHead>
                <TableHead className={HEAD}>Interview</TableHead>
                <TableHead className={HEAD}>When</TableHead>
                <TableHead className={`${HEAD} hidden md:table-cell`}>Mode</TableHead>
                <TableHead className={`${HEAD} hidden lg:table-cell`}>Interviewer</TableHead>
                <TableHead className={HEAD}>Status</TableHead>
                <TableHead className="w-10 px-3">
                  <span className="sr-only">Open</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((i) => {
                const ModeIcon = MODE_ICONS[i.mode];
                const href = applicantInterviewHref(i.applicantRef);
                return (
                  <TableRow key={i.id} className="group">
                    <TableCell className="px-3 py-3.5">
                      <Link href={href} className="font-head text-sm font-bold hover:text-brand">
                        {i.applicant}
                      </Link>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {i.applicantRef}
                      </p>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <p className="font-medium">{i.round}</p>
                      <p className="text-xs text-muted-foreground">{i.designation}</p>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 whitespace-nowrap">
                      <p className="font-medium">
                        {formatIst(i.startsAt, { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatIst(i.startsAt, { hour: "numeric", minute: "2-digit" })} ·{" "}
                        {i.durationMins} min
                      </p>
                    </TableCell>
                    <TableCell className="hidden px-3 py-3.5 md:table-cell">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <ModeIcon className="size-3.5 flex-none text-brand" />
                        {i.mode}
                      </span>
                      <p className="text-xs text-muted-foreground">{placeSummary(i)}</p>
                    </TableCell>
                    <TableCell className="hidden px-3 py-3.5 text-muted-foreground lg:table-cell">
                      {i.interviewer}
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <Link href={href}>
                        <InterviewStatusPill interview={i} now={now} />
                      </Link>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <Link
                        href={href}
                        aria-label={`Open ${i.applicant}`}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
