"use client";

import Link from "next/link";
import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import {
  adminTableFeatures,
  DataTable,
  formatDate,
  industryName,
} from "@/components/admin/data-table";
import { FilterSelect } from "@/components/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { PLAN_DETAILS, isMembershipActive, type MembershipPlan } from "@/lib/membership";
import {
  ADMIN_CATEGORY_BADGES,
  ADMIN_CATEGORY_LABELS,
  type CandidateCategory,
} from "@/lib/placements";
import { cn } from "@/lib/utils";

export type AdminCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  industry: string;
  plan: MembershipPlan | null;
  membershipExpiresAt: string | null;
  emailVerified: boolean;
  createdAt: string;
  category: CandidateCategory;
  franchise: { id: string; name: string; code: string } | null;
};

const helper = createColumnHelper<typeof adminTableFeatures, AdminCandidate>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "Candidate",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-44">
        <p className="font-head font-bold">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor((c) => `${ADMIN_CATEGORY_LABELS[c.category]} ${c.franchise?.name ?? ""} ${c.franchise?.code ?? ""}`, {
    id: "category",
    header: "Type",
    sortFn: "text",
    cell: ({ row }) => {
      const { category, franchise } = row.original;
      return (
        <div className="flex flex-col items-start gap-0.5">
          <Badge className={cn("font-head font-bold", ADMIN_CATEGORY_BADGES[category])}>
            {ADMIN_CATEGORY_LABELS[category]}
          </Badge>
          {franchise && (
            <Link
              href={`/admin/franchises/${franchise.id}`}
              onClick={(e) => e.stopPropagation()}
              className="max-w-40 truncate text-[11px] text-muted-foreground hover:text-brand hover:underline"
            >
              {franchise.name}
            </Link>
          )}
        </div>
      );
    },
  }),
  helper.accessor("phone", {
    header: "Phone",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">{getValue()}</span>
    ),
  }),
  helper.accessor("city", {
    header: "City",
    sortFn: "text",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
  helper.accessor((c) => industryName(c.industry), {
    id: "industry",
    header: "Sector",
    sortFn: "text",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
  helper.accessor((c) => c.plan ?? "", {
    id: "plan",
    header: "Membership",
    sortFn: "text",
    cell: ({ row }) => {
      const { plan, membershipExpiresAt } = row.original;
      const active = isMembershipActive(membershipExpiresAt);
      return (
        <div className="flex flex-col items-start gap-0.5">
          <Badge
            className={cn(
              "font-head font-bold",
              plan && active ? "bg-good/12 text-good" : "bg-muted text-muted-foreground",
            )}
          >
            {plan ? PLAN_DETAILS[plan].badge : "Unpaid"}
          </Badge>
          {plan && membershipExpiresAt && (
            <span className="text-[11px] text-muted-foreground">
              {active ? "till" : "expired"} {formatDate(membershipExpiresAt)}
            </span>
          )}
        </div>
      );
    },
  }),
  helper.accessor("emailVerified", {
    header: "Email",
    enableSorting: false,
    cell: ({ getValue }) =>
      getValue() ? (
        <span className="text-xs font-semibold text-good">Confirmed</span>
      ) : (
        <span className="text-xs text-muted-foreground">Pending</span>
      ),
  }),
  helper.accessor("createdAt", {
    header: "Joined",
    sortFn: "basic",
    sortDescFirst: true,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap text-muted-foreground">{formatDate(getValue())}</span>
    ),
  }),
]);

const COLUMN_CLASS: Record<string, string> = {
  email: "hidden",
  category: "hidden sm:table-cell",
  phone: "hidden lg:table-cell",
  city: "hidden md:table-cell",
  industry: "hidden xl:table-cell",
  emailVerified: "hidden sm:table-cell",
  createdAt: "hidden md:table-cell",
};

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "experienced", label: "Experienced" },
  { value: "fresher", label: "Fresher" },
  { value: "franchise", label: "Franchise" },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]["value"];

export function CandidatesTable({ candidates }: { candidates: AdminCandidate[] }) {
  const [type, setType] = useState<TypeFilter>("all");
  return (
    <DataTable
      key={type}
      data={type === "all" ? candidates : candidates.filter((c) => c.category === type)}
      toolbar={
        <FilterSelect label="Type" options={TYPE_FILTERS} value={type} onChange={setType} />
      }
      columns={columns}
      getRowId={(c) => c.id}
      searchable={["name", "email", "phone", "city", "industry", "category"]}
      searchPlaceholder="Search name, email, phone, city or franchise"
      initialSort={{ id: "createdAt", desc: true }}
      columnClass={COLUMN_CLASS}
      emptyTitle="No candidates yet"
    />
  );
}
