import { PolicyPage } from "@/components/policy-page";
import { EMPLOYER_TERMS_SECTIONS, EMPLOYER_TERMS_VERSION } from "@/lib/terms-content";

export const metadata = {
  title: "Employer Terms — JobClubb",
  description: "The terms governing how employers hire on JobClubb.com.",
  alternates: { canonical: "/employer-terms" },
};

export default function EmployerTermsPage() {
  return (
    <PolicyPage
      eyebrow={`Version ${EMPLOYER_TERMS_VERSION}`}
      title="Employer Terms"
      description="These terms govern how employers post jobs and hire on JobClubb.com. Please read them in full."
      sections={EMPLOYER_TERMS_SECTIONS}
      footnote={`Version ${EMPLOYER_TERMS_VERSION}`}
    />
  );
}
