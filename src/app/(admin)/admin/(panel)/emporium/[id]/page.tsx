import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import {
  AddBatchButton,
  BatchSection,
  RefreshButton,
} from "@/components/admin/emporium";
import { requireAdmin } from "@/server/admin/session";
import { getEmporiumLocation } from "@/server/emporium/batches";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/admin/emporium/[id]">) {
  const { id } = await params;
  const location = UUID_PATTERN.test(id) ? await getEmporiumLocation(id) : null;
  return { title: `${location ? `Emporium ${location.name}` : "Emporium"} — JobClubb admin` };
}

export default async function AdminEmporiumLocationPage({
  params,
}: PageProps<"/admin/emporium/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const location = await getEmporiumLocation(id);
  if (!location) notFound();

  const seats = location.batches.reduce((sum, b) => sum + b.seats, 0);
  const used = location.batches.reduce((sum, b) => sum + b.used, 0);
  const nextBatchNo = Math.max(0, ...location.batches.map((b) => b.batchNo)) + 1;

  return (
    <div className="flex-1 space-y-6 px-4 py-6">
      <Link
        href="/admin/emporium"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All locations
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-head text-2xl font-extrabold tracking-tight">
              Emporium {location.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {location.batches.length} {location.batches.length === 1 ? "batch" : "batches"} ·{" "}
              {used} of {seats} seats used
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <AddBatchButton
            locations={[{ name: location.name, nextBatchNo }]}
            fixedLocation={location.name}
          />
        </div>
      </div>

      <div className="space-y-5">
        {location.batches.map((batch) => (
          <BatchSection key={batch.id} batch={batch} location={location.name} />
        ))}
      </div>
    </div>
  );
}
