"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import type { JobFormState } from "@/app/(app)/company/dashboard/jobs/actions";
import { Panel } from "@/components/candidate/dashboard-ui";
import {
  FormStatus,
  SubmitButton,
  submitManually,
} from "@/components/candidate/settings-forms";
import {
  Field,
  FieldError,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobFormDefaults } from "@/lib/company-jobs";
import { JOB_TYPES, VERTICALS, WORK_MODES } from "@/lib/taxonomy";

const SECTOR_OPTIONS = VERTICALS.map((v) => ({ value: v.slug, label: v.name }));
const JOB_TYPE_OPTIONS = JOB_TYPES.map((t) => ({ value: t, label: t }));
const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  WFO: "Work from office",
  WFH: "Work from home",
  Hybrid: "Hybrid",
  Field: "Field",
  Onsite: "Onsite",
};
const WORK_MODE_OPTIONS = WORK_MODES.map((m) => ({
  value: m,
  label: WORK_MODE_LABELS[m],
}));

export function JobForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: {
  action: (prev: JobFormState, formData: FormData) => Promise<JobFormState>;
  defaults: JobFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [initial] = useState(defaults);
  const [vertical, setVertical] = useState<string | null>(defaults.vertical);
  const [role, setRole] = useState<string | null>(defaults.role);
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const hasErrors = Object.keys(errors).length > 0;
  const roleOptions = (
    VERTICALS.find((v) => v.slug === vertical)?.roles ?? []
  ).map((r) => ({ value: r, label: r }));

  return (
    <form
      onSubmit={(e) => {
        clearAll();
        submitManually(formAction)(e);
      }}
      onChange={onChange}
      noValidate
      className="space-y-6"
    >
      <Panel title="Role" description="What you're hiring for and how many people you need.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="vertical"
            label="Sector"
            required
            options={SECTOR_OPTIONS}
            value={vertical}
            onValueChange={(v) => {
              setVertical(v);
              setRole(null);
              clear("vertical", "role");
            }}
            error={errors.vertical}
          />
          <SelectField
            id="role"
            label="Role"
            required
            placeholder="Choose a role"
            options={roleOptions}
            value={role}
            onValueChange={(v) => {
              setRole(v);
              clear("role");
            }}
            error={errors.role}
          />
          <Field
            id="designation"
            label="Job title"
            required
            placeholder="e.g. Front Office Executive"
            defaultValue={initial.designation}
            maxLength={120}
            hint="The title candidates see on the job board."
            error={errors.designation}
          />
          <Field
            id="openings"
            label="Openings"
            required
            inputMode="numeric"
            defaultValue={initial.openings}
            maxLength={3}
            error={errors.openings}
          />
        </div>
      </Panel>

      <Panel title="Location and type" description="Candidates near this pincode see the role first.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="city"
            label="City"
            required
            autoComplete="address-level2"
            defaultValue={initial.city}
            maxLength={80}
            error={errors.city}
          />
          <Field
            id="pincode"
            label="Pincode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={initial.pincode}
            maxLength={6}
            error={errors.pincode}
          />
          <SelectField
            id="jobType"
            label="Job type"
            required
            options={JOB_TYPE_OPTIONS}
            defaultValue={initial.jobType}
            onValueChange={() => clear("jobType")}
            error={errors.jobType}
          />
          <SelectField
            id="workMode"
            label="Work mode"
            required
            options={WORK_MODE_OPTIONS}
            defaultValue={initial.workMode}
            onValueChange={() => clear("workMode")}
            error={errors.workMode}
          />
        </div>
      </Panel>

      <Panel title="Experience and pay" description="Ranges are fine. Use 0 years for freshers.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="experienceMin"
            label="Minimum experience (years)"
            required
            inputMode="numeric"
            defaultValue={initial.experienceMin}
            maxLength={2}
            error={errors.experienceMin}
          />
          <Field
            id="experienceMax"
            label="Maximum experience (years)"
            required
            inputMode="numeric"
            defaultValue={initial.experienceMax}
            maxLength={2}
            error={errors.experienceMax}
          />
          <Field
            id="salaryMinLpa"
            label="Minimum salary (₹ LPA)"
            required
            inputMode="decimal"
            placeholder="e.g. 3.5"
            defaultValue={initial.salaryMinLpa}
            maxLength={6}
            error={errors.salaryMinLpa}
          />
          <Field
            id="salaryMaxLpa"
            label="Maximum salary (₹ LPA)"
            required
            inputMode="decimal"
            placeholder="e.g. 5"
            defaultValue={initial.salaryMaxLpa}
            maxLength={6}
            error={errors.salaryMaxLpa}
          />
        </div>
      </Panel>

      <Panel
        title="Job description"
        description="Only members can read these details on the job board."
        footer={
          <>
            <FormStatus
              error={
                formError ??
                (hasErrors ? "Fix the highlighted fields and try again." : undefined)
              }
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="h-10 font-head"
                nativeButton={false}
                render={<Link href={cancelHref} />}
              >
                Cancel
              </Button>
              <SubmitButton pending={pending}>
                {pending ? "Submitting..." : submitLabel}
              </SubmitButton>
            </div>
          </>
        }
      >
        <div className="grid gap-5">
          <TextareaField
            id="description"
            label="About the role"
            required
            rows={4}
            maxLength={4000}
            defaultValue={initial.description}
            placeholder="A short summary of the role, the team and what a great hire looks like."
            error={errors.description}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextareaField
              id="responsibilities"
              label="Responsibilities"
              required
              rows={5}
              defaultValue={initial.responsibilities}
              hint="One per line."
              error={errors.responsibilities}
            />
            <TextareaField
              id="requirements"
              label="Requirements"
              required
              rows={5}
              defaultValue={initial.requirements}
              hint="One per line."
              error={errors.requirements}
            />
          </div>
          <TextareaField
            id="benefits"
            label="Benefits"
            optional
            rows={3}
            defaultValue={initial.benefits}
            placeholder={"Duty meals\nMedical cover"}
            hint="One per line."
            error={errors.benefits}
          />
        </div>
      </Panel>
    </form>
  );
}

function TextareaField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  ...props
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
} & Pick<
  React.ComponentProps<"textarea">,
  "rows" | "maxLength" | "defaultValue" | "placeholder"
>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      <Textarea
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-24 bg-card"
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
