"use client";

import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
};

function FieldShell({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className = "",
  children,
}: FieldShellProps & { children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
        {optional && (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function Field({
  id,
  type = "text",
  placeholder,
  inputClassName,
  ...props
}: FieldShellProps & {
  type?: string;
  placeholder?: string;
  inputClassName?: string;
} & Pick<
    React.ComponentProps<"input">,
    "autoComplete" | "inputMode" | "maxLength"
  >) {
  const { label, required, optional, hint, error, className, ...inputProps } = props;
  return (
    <FieldShell {...{ id, label, required, optional, hint, error, className }}>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 bg-card ${inputClassName ?? ""}`}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  options,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  ...shell
}: FieldShellProps & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
}) {
  return (
    <FieldShell id={id} {...shell}>
      <Select
        name={id}
        items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
        {...(value !== undefined ? { value } : { defaultValue })}
        onValueChange={(v) => onValueChange?.(v as string | null)}
      >
        <SelectTrigger
          id={id}
          className="h-11! w-full bg-card"
          aria-invalid={!!shell.error}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

// A styled drop-zone style file picker. The real input stays in the form (so it
// submits with FormData) but is visually hidden inside the clickable label.
export function FileField({
  id,
  label,
  description,
  error,
  required,
}: {
  id: string;
  label: string;
  description: string;
  error?: string;
  required?: boolean;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed bg-card p-4 transition-colors hover:border-brand hover:bg-brand/5 has-focus-visible:border-brand has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${
          error ? "border-destructive/60" : fileName ? "border-good/50" : "border-border"
        }`}
      >
        <span
          className={`flex size-11 flex-none items-center justify-center rounded-xl transition-colors ${
            fileName ? "bg-good/15 text-good" : "bg-muted text-brand group-hover:bg-brand/10"
          }`}
        >
          {fileName ? <FileCheck2 className="size-5" /> : <Upload className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-head text-sm font-bold">
            {label}
            {required && <span className="text-destructive">*</span>}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {fileName ?? description}
          </span>
        </span>
        <span className="hidden rounded-lg border border-border bg-background px-3 py-1.5 font-head text-xs font-semibold sm:inline">
          {fileName ? "Change" : "Browse"}
        </span>
        <input
          id={id}
          name={id}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}
