import Link from "next/link";
import { ChevronRight, Layers, MapPin, School, Users } from "lucide-react";

import {
  AddBatchButton,
  RefreshButton,
  SeatMeter,
} from "@/components/admin/emporium";
import { requireAdmin } from "@/server/admin/session";
import { listEmporiumLocations } from "@/server/emporium/batches";

export const metadata = { title: "Emporium — JobClubb admin" };

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

export default async function AdminEmporiumPage() {
  await requireAdmin();
  const locations = await listEmporiumLocations();
  const options = locations.map((l) => ({
    name: l.name,
    nextBatchNo: l.nextBatchNo,
  }));
  const totals = {
    batches: locations.reduce((sum, l) => sum + l.batches, 0),
    students: locations.reduce((sum, l) => sum + l.used, 0),
  };

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-head text-2xl font-extrabold tracking-tight">
            Emporium
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each batch at an Emporium centre gets one sign-up code. Students who
            join with it get a year of membership without paying.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <AddBatchButton locations={options} />
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-4 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <School className="size-5" />
          </span>
          <p className="mt-4 font-head font-bold">No Emporium centres yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add the first batch with its location, batch number and number of
            students. The location card appears here once its code is generated.
          </p>
          <div className="mt-5">
            <AddBatchButton locations={options} label="Add first batch" />
          </div>
        </div>
      ) : (
        <>
          {/* <p className="text-sm text-muted-foreground">
            {locations.length} {locations.length === 1 ? "location" : "locations"} ·{" "}
            {totals.batches} {totals.batches === 1 ? "batch" : "batches"} · {totals.students}{" "}
            {totals.students === 1 ? "student" : "students"} joined
          </p> */}
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => (
              <li key={location.id}>
                <Link
                  href={`/admin/emporium/${location.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors outline-none hover:border-brand/40 hover:bg-brand/3 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <MapPin className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-head text-lg font-extrabold tracking-tight">
                        {location.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.latestBatchAt
                          ? `Latest batch ${formatDate(location.latestBatchAt)}`
                          : "No batches"}
                      </p>
                    </div>
                    <ChevronRight className="mt-2 size-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
                    <div className="bg-card px-3 py-2.5">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Layers className="size-3.5" /> Batches
                      </dt>
                      <dd className="mt-0.5 font-head font-bold">
                        {location.batches}
                        {location.activeBatches < location.batches && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            ({location.batches - location.activeBatches} paused)
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="bg-card px-3 py-2.5">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" /> Students
                      </dt>
                      <dd className="mt-0.5 font-head font-bold">
                        {location.used}
                      </dd>
                    </div>
                  </dl>

                  <SeatMeter
                    used={location.used}
                    seats={location.seats}
                    className="mt-4"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
