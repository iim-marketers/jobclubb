import { PolicyPage } from "@/components/policy-page";
import { TERMS_SECTIONS, TERMS_VERSION } from "@/lib/terms-content";

export const metadata = {
  title: "Terms of Use — JobClubb",
  description: "The terms governing your use of JobClubb.com.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow={`Version ${TERMS_VERSION}`}
      title="Terms of Use"
      description="These terms govern your use of JobClubb.com. Please read them in full."
      sections={TERMS_SECTIONS}
      footnote={`Version ${TERMS_VERSION}`}
    />
  );
}
