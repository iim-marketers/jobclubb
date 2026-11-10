import Link from "next/link";
import { ChevronRight, Plus, Store } from "lucide-react";

import { FranchisesTable } from "@/components/admin/franchise-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { franchiseStatus, lastDayOf } from "@/lib/franchise";
import { formatDateOnly, todayIst } from "@/lib/placements";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/session";
import { isApproved, listFranchises } from "@/server/franchises/franchises";

export const metadata = { title: "Franchises — JobClubb admin" };

const TABS = [
  { key: "franchises", label: "Franchises" },
  { key: "sign-ups", label: "Sign-ups" },
] as const;

export default async function AdminFranchisesPage({
  searchParams,
}: PageProps<"/admin/franchises">) {
  await requireAdmin();
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "sign-ups" ? "sign-ups" : "franchises";
  const franchises = await listFranchises();
  const signUps = franchises.filter((f) => !isApproved(f));
  const pending = signUps.filter((f) => f.status === "pending");

  const rows = franchises.filter(isApproved).map((f) => {
    const status = franchiseStatus(f);
    return {
      id: f.id,
      name: f.name,
      code: f.code,
      city: f.city,
      ownerName: f.ownerName,
      status,
      lastDay: status === "upcoming" ? f.startsOn : lastDayOf(f),
      candidates: f.candidates,
      paidCandidates: f.paidCandidates,
      outstanding: f.outstanding,
    };
  });

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-head text-2xl font-extrabold tracking-tight">
            Franchises
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Franchisees sign up themselves and wait here for approval. Approve
            them once the agreement is signed and the fee is paid. They then
            register candidates from their own dashboard, earning half of each
            candidate&apos;s first membership fee and half of their placement
            fee.
          </p>
        </div>
        <Button
          className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          nativeButton={false}
          render={<Link href="/admin/franchises/new" />}
        >
          <Plus className="size-4" />
          Add franchise
        </Button>
      </div>

      <nav
        aria-label="Franchise views"
        className="flex gap-1 border-b border-border"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={
              t.key === "franchises"
                ? "/admin/franchises"
                : "/admin/franchises?tab=sign-ups"
            }
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 font-head text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
              tab === t.key && "border-brand text-foreground",
            )}
          >
            {t.label}
            {t.key === "sign-ups" && pending.length > 0 && (
              <span className="rounded-full bg-brand px-1.5 text-[11px] font-bold text-brand-foreground">
                {pending.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {tab === "sign-ups" ? (
        signUps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground">
            No franchise sign-ups waiting. New ones appear here as soon as
            someone signs up.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {signUps.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/admin/franchises/${f.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-head font-bold">{f.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.ownerName} · {f.city} · signed up{" "}
                      {formatDateOnly(todayIst(new Date(f.createdAt)))}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs sm:inline",
                      f.emailVerifiedAt ? "text-good" : "text-muted-foreground",
                    )}
                  >
                    {f.emailVerifiedAt
                      ? "Email confirmed"
                      : "Email not confirmed"}
                  </span>
                  <Badge
                    className={cn(
                      "font-head font-bold",
                      f.status === "pending"
                        ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {f.status === "pending" ? "Awaiting approval" : "Rejected"}
                  </Badge>
                  <ChevronRight className="size-4 flex-none text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-4 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Store className="size-5" />
          </span>
          <p className="mt-4 font-head font-bold">No approved franchises yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {pending.length > 0
              ? `${pending.length} ${pending.length === 1 ? "sign-up is" : "sign-ups are"} waiting for approval.`
              : "Franchisees appear here once you approve their sign-up, or when you add one yourself."}
          </p>
          {pending.length > 0 && (
            <Button
              className="mt-5 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              nativeButton={false}
              render={<Link href="/admin/franchises?tab=sign-ups" />}
            >
              Review sign-ups
            </Button>
          )}
        </div>
      ) : (
        <FranchisesTable franchises={rows} />
      )}
    </div>
  );
}
