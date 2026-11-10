import "server-only";

import type { ApprovedFranchise } from "@/server/franchises/franchises";
import { getLedger, statementCsv } from "@/server/franchises/ledger";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function statementResponse(franchise: Pick<ApprovedFranchise, "id" | "name" | "code">, month: string | null) {
  if (!month || !MONTH.test(month)) return new Response("Choose a month, like 2026-11.", { status: 400 });
  const csv = statementCsv(franchise, month, await getLedger(franchise.id));
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jobclubb-${franchise.code.toLowerCase()}-${month}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
