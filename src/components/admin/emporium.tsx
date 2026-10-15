"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Link2,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBatch,
  deleteBatch,
  setBatchActive,
  updateBatchSeats,
} from "@/app/(admin)/admin/(panel)/emporium/actions";
import { formatDate } from "@/components/admin/data-table";
import { FormStatus, submitManually } from "@/components/candidate/settings-forms";
import { FieldError, useFieldErrors } from "@/components/sign-up/fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  batchTag,
  MAX_BATCH_NO,
  MAX_BATCH_SEATS,
  type EmporiumBatch,
  type EmporiumStudent,
} from "@/lib/emporium";
import { cn } from "@/lib/utils";

const brandButton = "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

type LocationOption = { name: string; nextBatchNo: number };

export function AddBatchButton({
  locations,
  fixedLocation,
  label = "Add batch",
}: {
  locations: LocationOption[];
  fixedLocation?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);

  return (
    <>
      <Button
        className={brandButton}
        onClick={() => {
          setInstance((n) => n + 1);
          setOpen(true);
        }}
      >
        <Plus className="size-4" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <AddBatchForm
            key={instance}
            locations={locations}
            fixedLocation={fixedLocation}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Refresh"
      title="Refresh"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={cn("size-4", pending && "animate-spin")} />
    </Button>
  );
}

function AddBatchForm({
  locations,
  fixedLocation,
  onDone,
}: {
  locations: LocationOption[];
  fixedLocation?: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createBatch, {});
  const { errors, formError, clear, clearAll } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );

  const find = (name: string) =>
    locations.find((l) => l.name.toLowerCase() === name.trim().replace(/\s+/g, " ").toLowerCase());

  const [location, setLocation] = useState(fixedLocation ?? "");
  const [batchNo, setBatchNo] = useState(String(find(fixedLocation ?? "")?.nextBatchNo ?? 1));
  const [batchEdited, setBatchEdited] = useState(false);
  const [seats, setSeats] = useState("");
  const existing = find(location);

  if (state.created) return <BatchCreated {...state.created} onDone={onDone} fixedLocation={!!fixedLocation} />;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
    >
      <DialogHeader className="border-b border-border px-5 pt-5 pb-4">
        <DialogTitle className="font-head text-lg font-extrabold">
          {fixedLocation ? `New batch for ${fixedLocation}` : "Add Emporium batch"}
        </DialogTitle>
        <DialogDescription>
          Generates a sign-up code the students in this batch use to join without
          paying for membership.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <Label htmlFor="location">
            Location<span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            name="location"
            list="emporium-locations"
            autoComplete="off"
            placeholder="e.g. Shillong"
            value={location}
            readOnly={!!fixedLocation}
            maxLength={80}
            aria-invalid={!!errors.location}
            className={cn("h-11 bg-card", fixedLocation && "bg-muted/50")}
            onChange={(e) => {
              setLocation(e.target.value);
              clear("location", "batchNo");
              if (!batchEdited)
                setBatchNo(String(find(e.target.value)?.nextBatchNo ?? 1));
            }}
          />
          {!fixedLocation && (
            <datalist id="emporium-locations">
              {locations.map((l) => (
                <option key={l.name} value={l.name} />
              ))}
            </datalist>
          )}
          {!errors.location && !fixedLocation && location.trim().length >= 2 && (
            <p className="text-xs text-muted-foreground">
              {existing
                ? `Adds a batch to ${existing.name}. Batches so far: ${existing.nextBatchNo - 1}.`
                : "New location. It gets its own card on the Emporium page."}
            </p>
          )}
          <FieldError message={errors.location} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batchNo">
              Batch no.<span className="text-destructive">*</span>
            </Label>
            <Input
              id="batchNo"
              name="batchNo"
              inputMode="numeric"
              value={batchNo}
              maxLength={String(MAX_BATCH_NO).length}
              aria-invalid={!!errors.batchNo}
              className="h-11 bg-card"
              onChange={(e) => {
                setBatchNo(e.target.value.replace(/\D/g, ""));
                setBatchEdited(true);
                clear("batchNo");
              }}
            />
            <FieldError message={errors.batchNo} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seats">
              Students<span className="text-destructive">*</span>
            </Label>
            <Input
              id="seats"
              name="seats"
              inputMode="numeric"
              placeholder="e.g. 20"
              value={seats}
              maxLength={String(MAX_BATCH_SEATS).length}
              aria-invalid={!!errors.seats}
              className="h-11 bg-card"
              onChange={(e) => {
                setSeats(e.target.value.replace(/\D/g, ""));
                clear("seats");
              }}
            />
            <FieldError message={errors.seats} />
          </div>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          The code works for exactly this many sign-ups. You can raise the limit
          later.
        </p>
        <FormStatus error={formError} />
      </div>

      <DialogFooter className="m-0 rounded-b-xl">
        <Button type="button" variant="outline" className="font-head" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" className={brandButton} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate code
        </Button>
      </DialogFooter>
    </form>
  );
}

function BatchCreated({
  batch,
  location,
  locationId,
  fixedLocation,
  onDone,
}: {
  batch: EmporiumBatch;
  location: string;
  locationId: string;
  fixedLocation: boolean;
  onDone: () => void;
}) {
  return (
    <div>
      <div className="flex flex-col items-center px-5 pt-7 pb-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-good/15 text-good">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <DialogTitle className="mt-4 font-head text-xl font-extrabold">
          Code generated
        </DialogTitle>
        <DialogDescription className="mt-1">
          {location} · Batch {batch.batchNo} ({batchTag(location, batch.batchNo)}) ·{" "}
          {batch.seats}{" "}
          {batch.seats === 1 ? "student" : "students"}
        </DialogDescription>

        <div className="mt-5 w-full rounded-2xl border-2 border-dashed border-brand/30 bg-brand/5 px-4 py-4">
          <p className="font-mono text-lg font-bold tracking-[0.08em] break-all text-brand sm:text-xl">
            {batch.code}
          </p>
        </div>

        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          <CopyButton value={batch.code} label="Copy code" copiedLabel="Code copied" />
          <CopyButton value={batch.signUpUrl} label="Copy sign-up link" copiedLabel="Link copied" icon={Link2} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Students enter the code on sign-up, or open the link to have it filled
          in. Their membership is active as soon as they verify their email.
        </p>
      </div>

      <DialogFooter className="m-0 rounded-b-xl">
        {!fixedLocation && (
          <Button
            variant="outline"
            className="font-head"
            nativeButton={false}
            render={<Link href={`/admin/emporium/${locationId}`} onClick={onDone} />}
          >
            View {location}
            <ArrowRight className="size-4" />
          </Button>
        )}
        <Button className={brandButton} onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}

function CopyButton({
  value,
  label,
  copiedLabel,
  icon: Icon = Copy,
  size = "default",
}: {
  value: string;
  label: string;
  copiedLabel: string;
  icon?: typeof Copy;
  size?: "default" | "sm";
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className="font-head"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          toast.error("Couldn't copy. Select the text and copy it instead.");
        }
      }}
    >
      {copied ? <Check className="size-4 text-good" /> : <Icon className="size-4" />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}

export function BatchStatusBadge({ batch }: { batch: Pick<EmporiumBatch, "active" | "used" | "seats"> }) {
  const full = batch.used >= batch.seats;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-head text-xs font-bold",
        !batch.active
          ? "bg-muted text-muted-foreground"
          : full
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-good/12 text-good",
      )}
    >
      {!batch.active ? "Paused" : full ? "Full" : "Active"}
    </span>
  );
}

export function SeatMeter({ used, seats, className }: { used: number; seats: number; className?: string }) {
  const ratio = seats > 0 ? Math.min(used / seats, 1) : 0;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">
          <span className="font-head text-sm font-bold text-foreground">{used}</span> of {seats} used
        </span>
        <span className="text-muted-foreground">{Math.max(seats - used, 0)} left</span>
      </div>
      <div
        role="meter"
        aria-label="Seats used"
        aria-valuemin={0}
        aria-valuemax={seats}
        aria-valuenow={used}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", ratio >= 1 ? "bg-amber-500" : "bg-brand")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

export function BatchSection({
  batch,
  location,
}: {
  batch: EmporiumBatch & { students: EmporiumStudent[] };
  location: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const { error } = await setBatchActive(batch.id, !batch.active);
      if (error) toast.error(error);
      else toast.success(batch.active ? `Batch ${batch.batchNo} paused` : `Batch ${batch.batchNo} resumed`);
    });
  }

  return (
    <section
      aria-labelledby={`batch-${batch.id}`}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="grid gap-5 border-b border-border p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`batch-${batch.id}`} className="font-head text-lg font-extrabold tracking-tight">
              Batch {batch.batchNo}
            </h2>
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
              {batchTag(location, batch.batchNo)}
            </span>
            <BatchStatusBadge batch={batch} />
            <span className="text-xs text-muted-foreground">Created {formatDate(batch.createdAt)}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg border border-dashed border-brand/30 bg-brand/5 px-3 py-1.5 font-mono text-sm font-bold tracking-wide break-all text-brand">
              {batch.code}
            </code>
            <CopyButton value={batch.code} label="Copy code" copiedLabel="Copied" size="sm" />
            <CopyButton value={batch.signUpUrl} label="Copy link" copiedLabel="Copied" icon={Link2} size="sm" />
          </div>
          {!batch.active && (
            <p className="mt-2 text-xs text-muted-foreground">
              Paused: new students can&apos;t sign up with this code until you resume it.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <SeatMeter used={batch.used} seats={batch.seats} />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" size="sm" className="font-head" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              Seats
            </Button>
            <Button variant="outline" size="sm" className="font-head" disabled={pending} onClick={toggleActive}>
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : batch.active ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              {batch.active ? "Pause" : "Resume"}
            </Button>
            {batch.used === 0 && (
              <Button variant="outline-destructive" size="sm" className="font-head" onClick={() => setDeleting(true)}>
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {batch.students.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Users className="size-4.5" />
          </span>
          <p className="mt-3 font-head text-sm font-bold">No students yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Share the code or sign-up link with this batch. Students show up here
            as soon as they sign up.
          </p>
        </div>
      ) : (
        <StudentsTable students={batch.students} />
      )}

      <EditSeatsDialog batch={batch} open={editing} onOpenChange={setEditing} />
      <DeleteBatchDialog
        batch={batch}
        location={location}
        open={deleting}
        onOpenChange={setDeleting}
        onRemovedLocation={() => router.push("/admin/emporium")}
      />
    </section>
  );
}

function StudentsTable({ students }: { students: EmporiumStudent[] }) {
  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="hover:bg-transparent">
          {[
            ["#", "w-10"],
            ["Student", ""],
            ["Phone", "hidden md:table-cell"],
            ["Signed up", "hidden sm:table-cell"],
            ["Email", ""],
            ["Membership till", "hidden lg:table-cell"],
          ].map(([label, className]) => (
            <TableHead
              key={label}
              className={cn(
                "h-10 px-3 text-xs font-semibold text-muted-foreground first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5",
                className,
              )}
            >
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s, i) => (
          <TableRow key={s.id}>
            <TableCell className="py-3 pl-4 text-xs text-muted-foreground tabular-nums sm:pl-5">
              {students.length - i}
            </TableCell>
            <TableCell className="px-3 py-3">
              <p className="font-head font-bold">{s.name}</p>
              <p className="text-xs break-all text-muted-foreground">{s.email}</p>
            </TableCell>
            <TableCell className="hidden px-3 py-3 whitespace-nowrap text-muted-foreground md:table-cell">
              {s.phone}
            </TableCell>
            <TableCell className="hidden px-3 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">
              {formatDate(s.joinedAt)}
            </TableCell>
            <TableCell className="px-3 py-3">
              {s.emailVerified ? (
                <span className="text-xs font-semibold text-good">Confirmed</span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </TableCell>
            <TableCell className="hidden px-3 py-3 pr-4 whitespace-nowrap text-muted-foreground sm:pr-5 lg:table-cell">
              {formatDate(s.membershipExpiresAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EditSeatsDialog({
  batch,
  open,
  onOpenChange,
}: {
  batch: EmporiumBatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <EditSeatsForm key={String(open)} batch={batch} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditSeatsForm({ batch, onDone }: { batch: EmporiumBatch; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    updateBatchSeats.bind(null, batch.id, batch.used),
    {},
  );
  const { errors, formError, clearAll, onChange } = useFieldErrors(state, state.errors, state.error);
  // Revalidation changes batch.seats while mounted; Base UI warns if defaultValue changes.
  const [initialSeats] = useState(() => String(batch.seats));

  useEffect(() => {
    if (!state.ok) return;
    toast.success(`Batch ${batch.batchNo} updated`);
    onDone();
  }, [state, batch.batchNo, onDone]);

  return (
    <form
      noValidate
      onChange={onChange}
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
    >
      <DialogHeader className="border-b border-border px-5 pt-5 pb-4">
        <DialogTitle className="font-head text-lg font-extrabold">
          Students in batch {batch.batchNo}
        </DialogTitle>
        <DialogDescription>
          {batch.used} {batch.used === 1 ? "student has" : "students have"} signed up
          so far, so the limit can&apos;t go below that.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 px-5 py-5">
        <Label htmlFor={`seats-${batch.id}`}>Students</Label>
        <Input
          id={`seats-${batch.id}`}
          name="seats"
          inputMode="numeric"
          defaultValue={initialSeats}
          maxLength={String(MAX_BATCH_SEATS).length}
          aria-invalid={!!errors.seats}
          className="h-11 bg-card"
        />
        <FieldError message={errors.seats} />
        <FormStatus error={formError} />
      </div>
      <DialogFooter className="m-0 rounded-b-xl">
        <Button type="button" variant="outline" className="font-head" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" className={brandButton} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteBatchDialog({
  batch,
  location,
  open,
  onOpenChange,
  onRemovedLocation,
}: {
  batch: EmporiumBatch;
  location: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemovedLocation: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete batch {batch.batchNo}?</AlertDialogTitle>
          <AlertDialogDescription>
            Code {batch.code} stops working straight away. If this is the last
            batch in {location}, the location is removed too.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const { error, locationRemoved } = await deleteBatch(batch.id);
                if (error) {
                  toast.error(error);
                  return;
                }
                onOpenChange(false);
                toast.success(`Batch ${batch.batchNo} deleted`);
                if (locationRemoved) onRemovedLocation();
              })
            }
          >
            {pending ? "Deleting…" : "Delete batch"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
