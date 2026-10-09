import { PageHeader } from "@/components/page-shell";
import { SectionNav } from "@/components/section-nav";
import { termsSlug } from "@/lib/terms-content";

export type PolicySection = { heading: string; body: string };

export function PolicyPage({
  eyebrow,
  title,
  description,
  sections,
  footnote,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PolicySection[];
  footnote: string;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden min-w-0 lg:block">
            <SectionNav
              headings={sections.map((s) => s.heading)}
              label={`${title} sections`}
            />
          </aside>

          <div className="min-w-0 space-y-10">
            {sections.map((section) => (
              <section
                key={section.heading}
                id={termsSlug(section.heading)}
                className="scroll-mt-28"
              >
                <h2 className="font-head text-lg font-bold tracking-tight">
                  {section.heading}
                </h2>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}

            <p className="border-t border-border pt-6 text-sm text-muted-foreground">
              {footnote} · Questions? Email{" "}
              <a
                href="mailto:contact@jobclubb.com"
                className="font-medium text-brand hover:underline"
              >
                contact@jobclubb.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
