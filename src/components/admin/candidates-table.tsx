"use client";

import { createColumnHelper } from "@tanstack/react-table";

import {
  adminTableFeatures,
  DataTable,
  formatDate,
  verticalName,
} from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AdminCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  vertical: string;
  plan: "free" | "member" | null;
  membershipExpiresAt: string | null;
  emailVerified: boolean;
  createdAt: string;
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
  helper.accessor((c) => verticalName(c.vertical), {
    id: "vertical",
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
      return (
        <div className="flex flex-col items-start gap-0.5">
          <Badge
            className={cn(
              "font-head font-bold",
              plan === "member" ? "bg-good/12 text-good" : "bg-muted text-muted-foreground",
            )}
          >
            {plan === "member" ? "Member" : plan === "free" ? "Free" : "Not chosen"}
          </Badge>
          {plan === "member" && membershipExpiresAt && (
            <span className="text-[11px] text-muted-foreground">
              till {formatDate(membershipExpiresAt)}
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
  phone: "hidden lg:table-cell",
  city: "hidden md:table-cell",
  vertical: "hidden xl:table-cell",
  emailVerified: "hidden sm:table-cell",
  createdAt: "hidden md:table-cell",
};

export function CandidatesTable({ candidates }: { candidates: AdminCandidate[] }) {
  return (
    <DataTable
      data={candidates}
      columns={columns}
      getRowId={(c) => c.id}
      searchable={["name", "email", "phone", "city", "vertical"]}
      searchPlaceholder="Search name, email, phone or city"
      initialSort={{ id: "createdAt", desc: true }}
      columnClass={COLUMN_CLASS}
      emptyTitle="No candidates yet"
    />
  );
}
