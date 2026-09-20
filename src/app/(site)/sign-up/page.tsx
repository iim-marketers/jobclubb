import Link from "next/link";
import { Check, Upload } from "lucide-react";

import { ScrollGatedTerms } from "@/components/scroll-gated-terms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCING_CHANNELS, VERTICALS } from "@/lib/taxonomy";

export const metadata = {
  title: "Create your account — JobClubb",
  description:
    "Create a free JobClubb profile and start applying to verified openings.",
};

export default function SignUpPage() {
  return (
    <>
      <div className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            <h1 className="font-head text-3xl font-extrabold tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-muted-foreground">
              Free to join. Upgrade whenever you&apos;re ready to unlock the
              full board.
            </p>

            <form className="mt-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="First name"
                  placeholder="Priya"
                  required
                />
                <Field
                  id="lastName"
                  label="Last name"
                  placeholder="Sharma"
                  required
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
                <Field
                  id="phone"
                  label="Mobile number"
                  type="tel"
                  placeholder="+91 90000 00000"
                  required
                />
                <Field id="city" label="City" placeholder="Kolkata" required />
                <Field
                  id="pincode"
                  label="Pincode"
                  placeholder="700001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vertical">Preferred sector</Label>
                <Select
                  items={Object.fromEntries(
                    VERTICALS.map((v) => [v.slug, v.name]),
                  )}
                  defaultValue="airlines"
                >
                  <SelectTrigger id="vertical" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERTICALS.map((v) => (
                      <SelectItem key={v.slug} value={v.slug}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">How did you hear about JobClubb?</Label>
                <Select defaultValue={SOURCING_CHANNELS[0]}>
                  <SelectTrigger id="source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCING_CHANNELS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Field
                id="code"
                label="Franchise, student or referral code (optional)"
                placeholder="JC-JOIN-XXXX"
              />

              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5">
                <div className="flex items-center gap-2 font-head text-sm font-bold">
                  <Upload className="size-4 text-brand" />
                  Student ID upload
                </div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  Only required if you&apos;re redeeming a student membership
                  code. Accepted formats: JPG, PNG or PDF, up to 5 MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 font-head"
                >
                  Choose file
                </Button>
              </div>

              <ScrollGatedTerms />

              <Button
                type="submit"
                className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              >
                Create my account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-brand hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          <aside className="space-y-4 self-start">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-head font-bold tracking-tight">
                What you get free
              </h2>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Job location",
                  "Job position",
                  "Experience required",
                  "Salary range",
                  "AI-built ATS resume",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 flex-none text-good" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-6">
              <h2 className="font-head text-sm font-bold tracking-tight">
                Your data stays yours
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Employers see only your skills and experience. Your name and
                contact details stay hidden until you choose to reveal them. We
                process personal data in line with the DPDP Act.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={id} type={type} placeholder={placeholder} />
    </div>
  );
}
