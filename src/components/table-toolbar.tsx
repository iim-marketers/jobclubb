"use client";

import { ListFilter, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function TableToolbar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {children}
    </div>
  );
}

export function TableSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm shadow-xs transition-colors outline-none placeholder:truncate placeholder:text-muted-foreground focus:border-brand focus:ring-3 focus:ring-brand/15"
      />
    </div>
  );
}

export type FilterOption<T extends string> = { value: T; label: string };

export function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Select
      items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
    >
      <SelectTrigger
        aria-label={`Filter by ${label.toLowerCase()}`}
        className="ml-auto h-10! w-40 flex-none gap-2 rounded-full border-border bg-card px-3.5 font-head font-semibold shadow-xs hover:bg-muted/60 sm:w-56"
      >
        <ListFilter className="size-4 text-muted-foreground" />
        <span className="hidden shrink-0 text-muted-foreground sm:inline">
          {label}:
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="w-(--anchor-width)">
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            title={o.label}
            className="*:first:min-w-0"
          >
            <span className="truncate">{o.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
