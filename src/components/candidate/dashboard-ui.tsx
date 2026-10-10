import { cn } from "@/lib/utils";

export function DashboardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  footer,
  className,
  id,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "min-w-0 scroll-mt-24 rounded-3xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-head font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
      {footer && (
        <div className="-mx-5 mt-4 -mb-5 flex flex-col-reverse gap-3 rounded-b-3xl border-t border-border bg-muted/40 px-5 py-4 sm:-mx-5 sm:-mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {footer}
        </div>
      )}
    </section>
  );
}

export function StatTile({
  label,
  value,
  note,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "brand" | "good" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        <span
          className={cn(
            "flex size-8 flex-none items-center justify-center rounded-lg",
            tone === "brand" && "bg-brand/10 text-brand",
            tone === "good" && "bg-good/12 text-good",
            tone === "muted" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-head text-2xl font-extrabold tracking-tight sm:text-3xl">
        {value}
      </p>
      {note && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

export function Chip({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className="size-3 flex-none" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="size-6" />
      </span>
      <p className="mt-5 font-head text-lg font-bold tracking-tight">{title}</p>
      {children && (
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
          {children}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
