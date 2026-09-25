export function ResumeCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 min-w-0">
        <h2 className="font-head font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
