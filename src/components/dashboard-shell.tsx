import Image from "next/image";
import Link from "next/link";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

export function DashboardShell({
  role,
  nav,
  title,
  subtitle,
  actions,
  children,
}: {
  role: string;
  nav: NavItem[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="border-b border-border bg-card lg:w-64 lg:flex-none lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:h-[72px]">
          <Link href="/" aria-label="JobClubb — home" className="flex items-center">
            <Image
              src="/brand/jobclubb-logo.png"
              alt="JobClubb"
              width={130}
              height={24}
              className="object-contain dark:hidden"
            />
            <Image
              src="/brand/jobclubb-logo-dark.png"
              alt=""
              aria-hidden
              width={130}
              height={24}
              className="hidden object-contain dark:block"
            />
          </Link>
        </div>

        <p className="px-4 font-head sm:px-6 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          {role}
        </p>

        <nav className="mt-3 flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible">
          {nav.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-none items-center gap-2.5 rounded-xl px-3 py-2.5 font-head text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-brand aria-[current=page]:text-brand-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 bg-background">
        <header className="border-b border-border px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-head text-2xl font-extrabold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions}
          </div>
        </header>

        <div className="px-4 py-8 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "brand";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-good",
    warn: "text-destructive",
    brand: "text-brand",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-head text-3xl font-extrabold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-head font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusPill({
  status,
}: {
  status: "Approved" | "In review" | "Rejected" | "Paid" | "Unpaid" | "Active" | "Inactive";
}) {
  const styles: Record<string, string> = {
    Approved: "bg-good/15 text-good",
    Paid: "bg-good/15 text-good",
    Active: "bg-good/15 text-good",
    "In review": "bg-brand/15 text-brand",
    Unpaid: "bg-destructive/10 text-destructive",
    Rejected: "bg-destructive/10 text-destructive",
    Inactive: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 font-head text-xs font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
