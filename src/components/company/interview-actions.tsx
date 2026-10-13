"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  cancelInterview,
  finishInterview,
  recordOutcome,
  saveInterview,
  type InterviewFormState,
} from "@/app/(app)/company/dashboard/applicants/actions";
import {
  FormStatus,
  submitManually,
} from "@/components/candidate/settings-forms";
import {
  Field,
  ReadOnlyField,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CompanyInterview } from "@/lib/company-activity";
import {
  DURATIONS,
  INTERVIEW_MODES,
  MAX_ROUNDS,
  PLACE_FIELD,
  istDateTime,
  modeValue,
  type InterviewModeValue,
  type InterviewPhase,
  type Venue,
} from "@/lib/interviews";

type JobLocation = Pick<Venue, "city" | "pincode">;

const DURATION_OPTIONS = DURATIONS.map((d) => ({
  value: String(d),
  label: d < 60 ? `${d} min` : `${d / 60} ${d === 60 ? "hour" : "hours"}`,
}));
const MODE_OPTIONS = INTERVIEW_MODES.map((m) => ({
  value: m.value,
  label: m.label,
}));

const brandButton =
  "bg-brand font-head text-brand-foreground hover:bg-brand-dark";

export function InterviewDialog({
  applicantRef,
  jobLocation,
  interview,
  roundNo = interview?.roundNo ?? 1,
}: {
  applicantRef: string;
  jobLocation: JobLocation;
  interview?: CompanyInterview;
  roundNo?: number;
}) {
  const [open, setOpen] = useState(false);
  const what = roundNo > 1 ? `round ${roundNo} interview` : "interview";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          interview ? (
            <Button variant="outline" className="font-head" />
          ) : (
            <Button className={brandButton} />
          )
        }
      >
        {interview
          ? "Reschedule"
          : roundNo > 1
            ? `Schedule round ${roundNo}`
            : "Schedule interview"}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">
            {interview ? `Reschedule ${what}` : `Schedule the ${what}`}
          </DialogTitle>
          <DialogDescription>
            Times are in India Standard Time. The candidate sees these details
            on their dashboard straight away.
          </DialogDescription>
        </DialogHeader>
        <InterviewForm
          applicantRef={applicantRef}
          jobLocation={jobLocation}
          interview={interview}
          onSaved={() => {
            setOpen(false);
            toast.success(
              `${what[0].toUpperCase()}${what.slice(1)} ${interview ? "rescheduled" : "scheduled"}`,
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function InterviewForm({
  applicantRef,
  jobLocation,
  interview,
  onSaved,
}: {
  applicantRef: string;
  jobLocation: JobLocation;
  interview?: CompanyInterview;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: InterviewFormState, formData: FormData) => {
      const result = await saveInterview(
        applicantRef,
        interview?.id ?? null,
        formData,
      );
      if (result.ok) onSaved();
      return result;
    },
    {},
  );
  const [mode, setMode] = useState<InterviewModeValue>(
    interview ? modeValue(interview.mode) : "video",
  );
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const starts = interview ? istDateTime(interview.startsAt) : null;
  const venue = interview?.venue ?? jobLocation;

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field
        id="date"
        type="date"
        label="Date"
        required
        defaultValue={starts?.date}
        error={errors.date}
      />
      <Field
        id="time"
        type="time"
        label="Start time"
        required
        defaultValue={starts?.time}
        error={errors.time}
      />
      <SelectField
        id="duration"
        label="Duration"
        required
        options={DURATION_OPTIONS}
        defaultValue={String(interview?.durationMins ?? 30)}
        onValueChange={() => clear("duration")}
        error={errors.duration}
      />
      <SelectField
        id="mode"
        label="Mode"
        required
        options={MODE_OPTIONS}
        value={mode}
        onValueChange={(v) => {
          if (v) setMode(v as InterviewModeValue);
          clear("mode", "place", "address", "landmark", "pincode");
        }}
        error={errors.mode}
      />
      {mode === "in_person" ? (
        <>
          <Field
            id="address"
            label="Address"
            required
            className="sm:col-span-2"
            placeholder="Building, street, area"
            hint="The candidate gets directions to this address."
            autoComplete="street-address"
            maxLength={200}
            defaultValue={interview?.venue?.address}
            error={errors.address}
          />
          <ReadOnlyField label="City" value={jobLocation.city} />
          <Field
            id="pincode"
            label="Pincode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            defaultValue={venue.pincode}
            error={errors.pincode}
          />
          <Field
            id="landmark"
            label="Landmark"
            optional
            className="sm:col-span-2"
            placeholder="e.g. Opposite City Mall"
            maxLength={100}
            defaultValue={interview?.venue?.landmark ?? undefined}
            error={errors.landmark}
          />
        </>
      ) : (
        <Field
          key={mode}
          id="place"
          label={PLACE_FIELD[mode].label}
          required
          className="sm:col-span-2"
          placeholder={PLACE_FIELD[mode].placeholder}
          hint={PLACE_FIELD[mode].hint}
          maxLength={300}
          defaultValue={
            interview && modeValue(interview.mode) === mode
              ? interview.place
              : undefined
          }
          error={errors.place}
        />
      )}
      <Field
        id="interviewer"
        label="Interviewer"
        required
        placeholder="e.g. Priya Sharma, HR Manager"
        maxLength={80}
        defaultValue={interview?.interviewer}
        error={errors.interviewer}
      />
      <Field
        id="round"
        label="Round"
        required
        placeholder="e.g. HR round"
        maxLength={60}
        defaultValue={interview?.round}
        error={errors.round}
      />
      {formError && (
        <div className="sm:col-span-2">
          <FormStatus error={formError} />
        </div>
      )}
      <DialogFooter className="sm:col-span-2">
        <DialogClose
          disabled={pending}
          render={<Button variant="outline" className="font-head" />}
        >
          Cancel
        </DialogClose>
        <Button type="submit" className={brandButton} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {interview ? "Save changes" : "Schedule"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InterviewControls({
  applicantRef,
  jobLocation,
  interview,
  phase,
}: {
  applicantRef: string;
  jobLocation: JobLocation;
  interview: CompanyInterview;
  phase: InterviewPhase;
}) {
  if (interview.outcome) return null;
  const run =
    (action: () => Promise<{ error?: string }>, success: string) =>
    async () => {
      const { error } = await action();
      if (error) toast.error(error);
      else toast.success(success);
      return !error;
    };

  return (
    <div className="flex flex-wrap gap-2">
      <InterviewDialog
        applicantRef={applicantRef}
        jobLocation={jobLocation}
        interview={interview}
      />
      {phase === "live" ? (
        <ConfirmAction
          label="Mark as finished"
          title="Has this interview finished?"
          description="It moves to awaiting result so you can record how it went. Use this when the interview ends before its scheduled time."
          confirmLabel="Mark as finished"
          onConfirm={run(
            () => finishInterview(applicantRef, interview.id),
            "Interview marked as finished",
          )}
        />
      ) : phase === "ended" ? (
        <>
          <ConfirmAction
            label="Not selected"
            title="Mark this applicant as not selected?"
            description="They'll see that they weren't selected for this role. This can't be undone."
            confirmLabel="Not selected"
            destructive
            onConfirm={run(
              () => recordOutcome(applicantRef, interview.id, "not_selected"),
              "Applicant marked as not selected",
            )}
          />
          {interview.roundNo < MAX_ROUNDS && (
            <ConfirmAction
              label="Next round"
              title={`Move them to round ${interview.roundNo + 1}?`}
              description="The applicant sees that they cleared this round, and you can then schedule their next one. This can't be undone."
              confirmLabel="Move to next round"
              onConfirm={run(
                () => recordOutcome(applicantRef, interview.id, "next_round"),
                `Moved to round ${interview.roundNo + 1}`,
              )}
            />
          )}
          <ConfirmAction
            label="Selected"
            title="Select this applicant?"
            description="Use this when they've cleared their final round. Then upload their offer letter from your Selected page: JobClubb shares it with the candidate and handles the placement. This can't be undone."
            confirmLabel="Selected"
            onConfirm={run(
              () => recordOutcome(applicantRef, interview.id, "selected"),
              "Applicant selected",
            )}
          />
        </>
      ) : (
        <ConfirmAction
          label="Cancel"
          title="Cancel this interview?"
          description={
            interview.roundNo > 1
              ? "It's removed from the applicant's calendar. You can schedule this round again any time."
              : "It's removed from the applicant's calendar and they go back to your shortlist. You can schedule a new one any time."
          }
          confirmLabel="Cancel interview"
          destructive
          onConfirm={run(
            () => cancelInterview(applicantRef, interview.id),
            "Interview cancelled",
          )}
        />
      )}
    </div>
  );
}

function ConfirmAction({
  label,
  icon: Icon,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger
        render={
          destructive ? (
            <Button
              variant="outline-destructive"
              className="font-head"
              disabled={pending}
            />
          ) : (
            <Button className={brandButton} disabled={pending} />
          )
        }
      >
        {Icon && <Icon className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            disabled={pending}
            render={<Button variant="outline" className="font-head" />}
          >
            Back
          </DialogClose>
          <Button
            variant={destructive ? "destructive" : "default"}
            className={destructive ? "font-head" : brandButton}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (await onConfirm()) setOpen(false);
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
