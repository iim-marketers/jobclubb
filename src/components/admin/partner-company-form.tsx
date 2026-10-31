"use client";

import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  MapPin,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { createPartner } from "@/app/(admin)/admin/(panel)/companies/actions";
import {
  FormStatus,
  SubmitButton,
} from "@/components/candidate/settings-forms";
import {
  Field,
  FieldError,
  SelectField,
  useFieldErrors,
} from "@/components/sign-up/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_SIZES } from "@/lib/company-verification";
import { toSquarePhoto } from "@/lib/square-photo";
import { COMPANY_INDUSTRY_OPTIONS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

const LOGO_TYPES = "image/jpeg,image/png,image/webp";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generatePassword() {
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(
    bytes,
    (n) => PASSWORD_CHARS[n % PASSWORD_CHARS.length],
  ).join("");
}

export function PartnerCompanyForm() {
  const [state, formAction, pending] = useActionState(createPartner, {});
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { errors, formError, clear, clearAll, onChange } = useFieldErrors(
    state,
    state.errors,
    state.error,
  );
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        clearAll();
        const data = new FormData(e.currentTarget);
        if (logo) data.set("logo", logo);
        startTransition(() => formAction(data));
      }}
      onChange={onChange}
      noValidate
      className="space-y-6"
    >
      <Section
        icon={Building2}
        title="Company profile"
        description="How the company appears to candidates on its job postings."
      >
        <LogoPicker
          logo={logo}
          preview={logoPreview}
          error={errors.logo}
          onChange={(file, preview) => {
            setLogo(file);
            setLogoPreview(preview);
            clear("logo");
          }}
        />
        <div className="mt-6 -mx-5 px-5 grid grid-cols-1 gap-5 border-t border-border pt-6 sm:grid-cols-2">
          <Field
            id="companyName"
            label="Registered company name"
            placeholder="E.g., Taj Hotels Ltd."
            required
            maxLength={120}
            error={errors.companyName}
            className="sm:col-span-2"
          />
          <SelectField
            id="industry"
            label="Industry"
            required
            placeholder="Choose an industry"
            options={COMPANY_INDUSTRY_OPTIONS}
            onValueChange={() => clear("industry")}
            error={errors.industry}
          />
          <SelectField
            id="size"
            label="Company size"
            required
            placeholder="Select size"
            options={COMPANY_SIZES}
            onValueChange={() => clear("size")}
            error={errors.size}
          />
          <Field
            id="website"
            label="Company website"
            placeholder="E.g., tajhotels.com"
            maxLength={255}
            error={errors.website}
          />
          <Field
            id="gstin"
            label="GSTIN"
            placeholder="E.g., 19AABCT1234F1Z5"
            maxLength={15}
            error={errors.gstin}
            inputClassName="uppercase placeholder:normal-case"
          />
        </div>
      </Section>

      <Section
        icon={MapPin}
        title="Office address"
        description="For JobClubb's records only. Every job is posted with its own city and pincode."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="city"
            label="City"
            placeholder="E.g., Kolkata"
            maxLength={80}
            error={errors.city}
          />
          <Field
            id="pincode"
            label="Pincode"
            placeholder="E.g., 700001"
            inputMode="numeric"
            maxLength={6}
            error={errors.pincode}
          />
        </div>
      </Section>

      <Section
        icon={UserRound}
        title="Contact person"
        description="The team's point of contact at the company for referrals and offers."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            id="contactName"
            label="Full name"
            placeholder="E.g., Rakesh Nair"
            required
            maxLength={80}
            error={errors.contactName}
          />
          <Field
            id="designation"
            label="Designation"
            placeholder="E.g., HR Manager"
            maxLength={80}
            error={errors.designation}
          />
          <Field
            id="phone"
            label="Mobile number"
            type="tel"
            placeholder="E.g., 9000000000"
            required
            error={errors.phone}
          />
        </div>
      </Section>

      <Section
        icon={KeyRound}
        title="Sign-in details"
        description="The company signs in with these. Share them once the account is created."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="email"
            label="Sign-in email"
            type="email"
            placeholder="E.g., hr@yourcompany.com"
            autoComplete="off"
            required
            error={errors.email}
          />
          <PasswordInput
            error={errors.password}
            onEdit={() => clear("password")}
          />
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <FormStatus
          error={
            formError ??
            (hasErrors
              ? "Fix the highlighted fields and try again."
              : undefined)
          }
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="h-10 font-head"
            nativeButton={false}
            render={<Link href="/admin/companies" />}
          >
            Cancel
          </Button>
          <SubmitButton pending={pending}>
            {pending ? "Creating..." : "Create partner company"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-head font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PasswordInput({
  error,
  onEdit,
}: {
  error?: string;
  onEdit: () => void;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy. Select the password and copy it instead.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="password">
          Password<span className="text-destructive">*</span>
        </Label>
        <button
          type="button"
          onClick={() => {
            setValue(generatePassword());
            setVisible(true);
            onEdit();
          }}
          className="font-head text-xs font-bold text-brand hover:text-brand-dark hover:underline"
        >
          Generate
        </button>
      </div>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
          className="h-11 bg-card pr-20 font-mono"
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 gap-0.5">
          <button
            type="button"
            onClick={copy}
            disabled={!value}
            aria-label="Copy password"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            {copied ? (
              <Check className="size-4 text-good" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>
      <FieldError id="password-error" message={error} />
    </div>
  );
}

function LogoPicker({
  logo,
  preview,
  error,
  onChange,
}: {
  logo: File | null;
  preview: string | null;
  error?: string;
  onChange: (file: File | null, preview: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pickError, setPickError] = useState<string>();

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setPickError(undefined);
    if (!LOGO_TYPES.split(",").includes(file.type))
      return setPickError("Choose a JPG, PNG or WebP image.");
    if (file.size > MAX_SOURCE_BYTES)
      return setPickError("That image is too large. Choose one under 20 MB.");

    setProcessing(true);
    try {
      const square = await toSquarePhoto(file, "contain");
      onChange(square, URL.createObjectURL(square));
    } catch {
      setPickError("We couldn't read that image. Try a different one.");
    } finally {
      setProcessing(false);
    }
  }

  const message = pickError ?? error;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <button
          type="button"
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          aria-label={logo ? "Change company logo" : "Upload company logo"}
          className={cn(
            "group relative flex size-24 flex-none items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white transition-colors outline-none hover:border-brand hover:bg-brand/5 focus-visible:ring-3 focus-visible:ring-ring/50",
            logo ? "border-solid border-border" : "border-border",
            dragging && "border-brand bg-brand/5",
            message && "border-destructive/60",
          )}
        >
          {preview ? (
            <span className="absolute inset-[12%]">
              <Image
                src={preview}
                alt=""
                fill
                unoptimized
                className="object-contain"
              />
            </span>
          ) : (
            <ImagePlus className="size-7 text-muted-foreground transition-colors group-hover:text-brand" />
          )}
          {processing && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" />
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={LOGO_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="min-w-0">
          <p className="font-head text-sm font-bold">Company logo</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Click or drop a JPG, PNG or WebP. It&apos;s fitted onto a white
            square. The company can change it later in settings.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={processing}
              onClick={() => inputRef.current?.click()}
              className="h-9 font-head"
            >
              {logo ? "Change logo" : "Choose file"}
            </Button>
            {logo && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange(null, null)}
                className="h-9 font-head text-muted-foreground"
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <FieldError message={message} />
    </div>
  );
}
