import { PageHeader, PageShell, Section } from "@/components/page-shell";
import { TERMS_SECTIONS, TERMS_VERSION } from "@/lib/terms-content";

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
      <Section>
        <div className="max-w-3xl space-y-7">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-head text-lg font-bold tracking-tight">
                {section.heading}
              </h2>
              <p className="mt-2 leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
