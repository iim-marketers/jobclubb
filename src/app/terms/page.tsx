import { PageHeader, PageShell } from "@/components/page-shell";
import { TermsNav } from "@/components/terms-nav";
import { TERMS_SECTIONS, TERMS_VERSION, termsSlug } from "@/lib/terms-content";

export const metadata = {
  title: "Terms of Use — JobClubb",
  description: "The terms governing your use of JobClubb.com.",
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow={`Version ${TERMS_VERSION}`}
        title="Terms of Use"
        description="These terms govern your use of JobClubb.com. Please read them in full."
      />

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
          {/* Table of contents */}
          <aside className="min-w-0">
            <TermsNav />
          </aside>

          {/* Terms */}
          <div className="min-w-0 space-y-10 lg:pb-[22rem]">
            {TERMS_SECTIONS.map((section) => (
              <section
                key={section.heading}
                id={termsSlug(section.heading)}
                className="scroll-mt-28"
              >
                <h2 className="font-head text-lg font-bold tracking-tight">
                  {section.heading}
                </h2>
                <p className="mt-2 leading-7 text-muted-foreground">{section.body}</p>
              </section>
            ))}

            <p className="border-t border-border pt-6 text-sm text-muted-foreground">
              Version {TERMS_VERSION} · Questions? Email{" "}
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
    </PageShell>
  );
}
