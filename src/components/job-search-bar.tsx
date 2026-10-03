"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search } from "lucide-react";

const FIELD =
  "h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground";

export function JobSearchBar({ member }: { member: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const loc = params.get("loc") ?? "";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams(params);
    for (const key of ["q", "loc"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(next.size ? `/jobs?${next}` : "/jobs");
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex h-10 w-full items-center gap-2 rounded-full border border-border bg-muted/50 pr-1 pl-3.5 transition-colors focus-within:border-brand focus-within:bg-card"
    >
      <Search className="size-4 flex-none text-muted-foreground" />
      {/* Keyed so the field resets when a filter chip clears the URL value. */}
      <input
        key={`q-${q}`}
        name="q"
        type="search"
        defaultValue={q}
        aria-label={member ? "Role, skill or company" : "Role"}
        placeholder={member ? "Role or company" : "Search roles"}
        className={FIELD}
      />
      {member && (
        <>
          <span aria-hidden className="hidden h-5 w-px bg-border lg:block" />
          <MapPin className="hidden size-4 flex-none text-muted-foreground lg:block" />
          <input
            key={`loc-${loc}`}
            name="loc"
            defaultValue={loc}
            aria-label="City or pincode"
            placeholder="City or pincode"
            className={`${FIELD} hidden max-w-40 lg:block`}
          />
        </>
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

export function JobSearchBarFallback() {
  return (
    <div className="h-10 w-full rounded-full border border-border bg-muted/50" />
  );
}
