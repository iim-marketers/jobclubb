"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  firstStepWithError,
  pickErrors,
  type FieldErrors,
  type SignUpStep,
} from "@/lib/sign-up-validation";

// Drives a multi-step sign-up form. Every step's fields stay mounted (inactive
// steps are just `hidden`), so the final submit sends one complete FormData.
export function useStepForm({
  steps,
  validate,
  action,
}: {
  steps: SignUpStep[];
  validate: (formData: FormData) => FieldErrors;
  action: (formData: FormData) => Promise<{ errors: FieldErrors } | undefined>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [values, setValues] = useState<Record<string, string>>({});
  // Step panels only animate once the person has moved between steps, so the
  // first step doesn't fade in on page load.
  const [moved, setMoved] = useState(false);
  const [pending, startTransition] = useTransition();
  const isLast = step === steps.length - 1;

  const readForm = () => new FormData(formRef.current!);

  function goTo(next: number) {
    setStep(next);
    setMoved(true);
    const top = formRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showErrors(all: FieldErrors) {
    setErrors(all);
    goTo(firstStepWithError(steps, all));
  }

  const formProps = {
    ref: formRef,
    noValidate: true,
    onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const formData = readForm();

      if (!isLast) {
        const stepErrors = pickErrors(validate(formData), steps[step].fields);
        setErrors(stepErrors);
        if (Object.keys(stepErrors).length === 0) goTo(step + 1);
        return;
      }

      const all = validate(formData);
      if (Object.keys(all).length > 0) return showErrors(all);

      startTransition(async () => {
        const result = await action(formData);
        if (result) showErrors(result.errors);
      });
    },
    // Keeps a snapshot of text values for live previews, and clears a field's
    // error as soon as the person edits it.
    onChange(e: React.FormEvent<HTMLFormElement>) {
      const name = (e.target as HTMLInputElement).name;
      if (name && errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
      const snapshot: Record<string, string> = {};
      readForm().forEach((v, k) => {
        if (typeof v === "string") snapshot[k] = v;
      });
      setValues(snapshot);
    },
  };

  return { step, isLast, errors, values, pending, moved, goTo, formProps };
}

export function StepProgress({
  steps,
  current,
  onJump,
}: {
  steps: SignUpStep[];
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title}>
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(i)}
              aria-current={active ? "step" : undefined}
              className="group w-full text-left disabled:cursor-default"
            >
              <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full bg-brand transition-[width] duration-500 ease-out ${
                    done || active ? "w-full" : "w-0"
                  } ${active ? "bg-linear-to-r from-brand to-brand-accent" : ""}`}
                />
              </span>
              <span className="mt-2.5 flex items-center gap-2">
                <span
                  className={`flex size-5 flex-none items-center justify-center rounded-full font-head text-[11px] font-bold transition-colors ${
                    done
                      ? "bg-brand text-brand-foreground"
                      : active
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`hidden truncate font-head text-xs font-semibold sm:block ${
                    active ? "text-foreground" : "text-muted-foreground"
                  } ${done ? "group-hover:text-brand" : ""}`}
                >
                  {s.title}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// One panel of the form. Inactive steps stay in the DOM but hidden.
export function StepPanel({
  index,
  current,
  total,
  step,
  animate,
  children,
}: {
  index: number;
  current: number;
  total: number;
  step: SignUpStep;
  animate: boolean;
  children: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const active = index === current;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (active) headingRef.current?.focus({ preventScroll: true });
  }, [active]);

  return (
    <section
      hidden={!active}
      aria-labelledby={`step-${index}-title`}
      className={
        animate
          ? "animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none"
          : undefined
      }
    >
      <p className="font-head text-xs font-bold tracking-[0.14em] text-brand uppercase">
        Step {index + 1} of {total}
      </p>
      <h2
        ref={headingRef}
        id={`step-${index}-title`}
        tabIndex={-1}
        className="mt-2 font-head text-2xl font-extrabold tracking-tight outline-none sm:text-3xl"
      >
        {step.title}
      </h2>
      <p className="mt-1.5 text-muted-foreground">{step.description}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function StepNav({
  step,
  isLast,
  pending,
  submitLabel,
  submitDisabled,
  hint,
  onBack,
}: {
  step: number;
  isLast: boolean;
  pending: boolean;
  submitLabel: string;
  submitDisabled?: boolean;
  hint?: string;
  onBack: () => void;
}) {
  return (
    <div className="mt-10 border-t border-border pt-6">
      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onBack}
            className="font-head"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={pending || (isLast && submitDisabled)}
          className="ml-auto min-w-40 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
        >
          {isLast ? (pending ? "Submitting…" : submitLabel) : "Continue"}
          {!isLast && <ArrowRight className="size-4" />}
        </Button>
      </div>
      {isLast && hint && (
        <p className="mt-3 text-right text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function FormAlert({ errors }: { errors: FieldErrors }) {
  const count = Object.keys(errors).length;
  if (count === 0) return null;
  return (
    <p
      role="alert"
      className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="size-4 flex-none" />
      {count === 1 ? "One field needs your attention." : `${count} fields need your attention.`}
    </p>
  );
}
