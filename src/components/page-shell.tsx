import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  footer?: boolean;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      {footer && <SiteFooter />}
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border bg-linear-to-b from-muted/60 to-background px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {eyebrow && (
          <p className="font-head text-xs font-bold tracking-[0.14em] text-brand uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-head text-xs font-bold tracking-[0.14em] text-brand uppercase">
      {children}
    </p>
  );
}

export function Section({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`px-4 py-16 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
