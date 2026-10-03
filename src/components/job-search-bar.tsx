"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const FIELD =
  "h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground";

function useJobSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const loc = params.get("loc") ?? "";

  function submit(values: { q: string; loc: string }) {
    const next = new URLSearchParams(params);
    for (const key of ["q", "loc"] as const) {
      const value = values[key].trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(next.size ? `/jobs?${next}` : "/jobs");
  }

  return { q, loc, submit };
}

export function JobSearchBar({ member }: { member: boolean }) {
  return (
    <>
      <div className="flex justify-end md:hidden">
        <MobileJobSearch member={member} />
      </div>
      <div className="hidden md:block">
        <InlineJobSearch member={member} />
      </div>
    </>
  );
}

function InlineJobSearch({ member }: { member: boolean }) {
  const { q, loc } = useJobSearch();
  return <InlineForm key={`${q}|${loc}`} member={member} />;
}

// Keyed by the URL values above so the fields reset after each navigation.
function InlineForm({ member }: { member: boolean }) {
  const { q, loc, submit } = useJobSearch();
  const [role, setRole] = useState(q);
  const [place, setPlace] = useState(loc);
  const roleRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submit({ q: role, loc: place });
      }}
      className="flex h-10 w-full items-center gap-2 rounded-full border border-border bg-muted/50 pr-1 pl-3.5 transition-colors focus-within:border-brand focus-within:bg-card"
    >
      <Search className="size-4 flex-none text-muted-foreground" />
      <input
        ref={roleRef}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        aria-label={member ? "Role or company" : "Role"}
        placeholder={member ? "Role, skill or company" : "Search jobs by role"}
        className={FIELD}
      />
      {role && (
        <ClearButton
          label="Clear role search"
          onClick={() => {
            setRole("");
            roleRef.current?.focus();
            if (q) submit({ q: "", loc: place });
          }}
        />
      )}
      {member && (
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <span aria-hidden className="h-5 w-px bg-border" />
          <MapPin className="size-4 flex-none text-muted-foreground" />
          <input
            ref={placeRef}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            aria-label="City or pincode"
            placeholder="City or pincode"
            className={`${FIELD} w-32`}
          />
          {place && (
            <ClearButton
              label="Clear location"
              onClick={() => {
                setPlace("");
                placeRef.current?.focus();
                if (loc) submit({ q: role, loc: "" });
              }}
            />
          )}
        </div>
      )}
      <button
        type="submit"
        aria-label="Search jobs"
        className="flex size-8 flex-none items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-dark focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}

function ClearButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-6 flex-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <X className="size-3.5" />
    </button>
  );
}

function MobileJobSearch({ member }: { member: boolean }) {
  const { q, loc, submit } = useJobSearch();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(q);
  const [place, setPlace] = useState(loc);
  const roleRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const summary = [q, member ? loc : ""].filter(Boolean).join(", ");

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setRole(q);
          setPlace(member ? loc : "");
        }
        setOpen(next);
      }}
    >
      <div className="flex h-9 w-full max-w-36 items-center rounded-full border border-border bg-muted/50 transition-colors focus-within:border-brand hover:border-brand/40">
        <SheetTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex h-full min-w-0 flex-1 items-center gap-2 rounded-full pl-3 text-left text-sm focus-visible:outline-none",
                summary ? "pr-1" : "pr-3",
              )}
            />
          }
        >
          <Search className="size-4 flex-none text-brand" />
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              summary ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {summary || "Search jobs"}
          </span>
        </SheetTrigger>
        {summary && (
          <ClearButton
            label="Clear search"
            onClick={() => submit({ q: "", loc: "" })}
            className="mr-1"
          />
        )}
      </div>

      <SheetContent
        side="top"
        initialFocus={roleRef}
        className="gap-0 rounded-b-3xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4"
      >
        <SheetTitle className="font-head text-lg font-bold tracking-tight">
          Search jobs
        </SheetTitle>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submit({ q: role, loc: place });
            setOpen(false);
          }}
          className="mt-4"
        >
          <div className="space-y-4">
            <SheetField
              icon={Search}
              id="m-search-q"
              label={member ? "Role or company" : "Role"}
              onClear={
                role
                  ? () => {
                      setRole("");
                      roleRef.current?.focus();
                    }
                  : undefined
              }
            >
              <Input
                ref={roleRef}
                id="m-search-q"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                enterKeyHint="search"
                autoComplete="off"
                placeholder={
                  member ? "e.g. Cabin crew, Taj" : "e.g. Cabin crew"
                }
                className="h-11 pr-10 pl-9 placeholder:text-sm"
              />
            </SheetField>
            <SheetField
              icon={MapPin}
              id="m-search-loc"
              label="City or pincode"
              locked={!member}
              onClear={
                place
                  ? () => {
                      setPlace("");
                      placeRef.current?.focus();
                    }
                  : undefined
              }
            >
              <Input
                ref={placeRef}
                id="m-search-loc"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                enterKeyHint="search"
                autoComplete="off"
                disabled={!member}
                placeholder={member ? "e.g. Mumbai or 400001" : "Members only"}
                className="h-11 pr-10 pl-9 placeholder:text-sm"
              />
            </SheetField>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-4 h-11 w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
          >
            Search
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SheetField({
  icon: Icon,
  id,
  label,
  locked = false,
  onClear,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  label: string;
  locked?: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {locked && <Lock className="size-3" />}
      </Label>
      <div className="relative">
        <Icon
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2",
            locked ? "text-muted-foreground" : "text-brand",
          )}
        />
        {children}
        {onClear && (
          <ClearButton
            label={`Clear ${label.toLowerCase()}`}
            onClick={onClear}
            className="absolute top-1/2 right-2.5 size-7 -translate-y-1/2"
          />
        )}
      </div>
    </div>
  );
}

export function JobSearchBarFallback() {
  return (
    <div className="ml-auto h-9 w-full max-w-36 rounded-full border border-border bg-muted/50 md:h-10 md:max-w-none" />
  );
}
