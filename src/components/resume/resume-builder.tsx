"use client";

import { startTransition, useActionState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

import {
  buildAtsResume,
  type ResumeActionState,
} from "@/app/(app)/candidate/dashboard/resume/actions";
import { Field, FieldError, FileField } from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function TextareaField({
  id,
  label,
  hint,
  error,
  placeholder,
  defaultValue,
  maxLength,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  defaultValue?: string;
  maxLength: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Textarea
        id={id}
        name={id}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="max-h-60 bg-card"
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function MoreOptions({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  // Closed <details> still submit their inputs with the form.
  return (
    <details open={defaultOpen} className="group px-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 font-head text-sm font-bold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 flex-none text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

export function ResumeBuilder({
  targetRole,
  jobDescription,
  roleSuggestions,
  hasResume,
}: {
  targetRole: string;
  jobDescription: string;
  roleSuggestions: string[];
  hasResume: boolean;
}) {
  const [state, formAction, pending] = useActionState<ResumeActionState, FormData>(
    buildAtsResume,
    {},
  );
  const errors = state.fieldErrors ?? {};

  const jobDescriptionField = (
    <TextareaField
      id="jobDescription"
      label="Job description"
      hint="Paste a posting to tailor keywords to it. Leave blank to use common keywords for the role."
      placeholder="Paste the full job description here"
      defaultValue={jobDescription}
      maxLength={12_000}
    />
  );
  const resumeField = (
    <FileField
      id="oldResume"
      label={hasResume ? "Upload a resume" : "Your current resume"}
      description="PDF, up to 5 MB"
      accept="application/pdf"
      error={errors.oldResume}
    />
  );

  return (
    <form
      // Submitting manually skips React's automatic form reset, so a failed
      // attempt doesn't wipe what the candidate typed.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-5"
    >
      <Field
        id="targetRole"
        label="Role you're applying for"
        required
        defaultValue={targetRole}
        list="role-suggestions"
        maxLength={120}
        placeholder="e.g. Front Office Executive"
        error={errors.targetRole}
      />
      <datalist id="role-suggestions">
        {roleSuggestions.map((role) => (
          <option key={role} value={role} />
        ))}
      </datalist>

      {hasResume ? (
        <>
          <TextareaField
            id="feedback"
            label="What should change"
            placeholder="e.g. Make the summary shorter and highlight my language skills"
            maxLength={2_000}
          />
          <TextareaField
            id="additions"
            label="Anything to add"
            placeholder="e.g. Fluent in Tamil. Won Employee of the Month, Mar 2025."
            maxLength={4_000}
            error={errors.additions}
          />
          <div className="divide-y divide-border rounded-2xl border border-border">
            <MoreOptions title="Tailor to a job post" defaultOpen={!!jobDescription}>
              {jobDescriptionField}
            </MoreOptions>
            <MoreOptions title="Rebuild from a different resume" defaultOpen={!!errors.oldResume}>
              {resumeField}
            </MoreOptions>
          </div>
        </>
      ) : (
        <>
          {jobDescriptionField}
          {resumeField}
          <TextareaField
            id="additions"
            label="Or tell us about yourself"
            hint="Jobs, dates, duties, achievements, education, languages — anything that isn't on your resume yet."
            placeholder="e.g. 2 years as Guest Relations Associate at Taj Lands End, Mumbai (Jun 2023 – Present). Handled 150+ check-ins a day…"
            maxLength={4_000}
            error={errors.additions}
          />
        </>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? "Building your resume…" : hasResume ? "Regenerate resume" : "Generate ATS resume"}
        </Button>
        <p aria-live="polite" className="text-center text-xs text-muted-foreground">
          {pending
            ? "This usually takes 20–40 seconds. Keep this tab open."
            : !hasResume && "We only use what you give us. Check every detail before you apply."}
        </p>
      </div>
    </form>
  );
}
