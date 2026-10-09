import { PolicyPage, type PolicySection } from "@/components/policy-page";

export const metadata = {
  title: "Privacy Policy — JobClubb",
  description: "How JobClubb collects, uses and protects your personal data.",
};

const SECTIONS: PolicySection[] = [
  {
    heading: "1. Who we are",
    body: "JobClubb.com is a recruitment portal for the Airlines, Hospitality and Travel & Tourism sectors, operated from Kolkata, India. This policy explains how we handle the personal data of candidates, employers and franchise partners who use the site.",
  },
  {
    heading: "2. What we collect",
    body: "We collect the details you give us when you create an account or build a profile: your name, email address, phone number, education, work history, skills, photograph and resume. Employers additionally provide company and contact details. We also record basic technical information such as your IP address, browser type and the pages you visit, to keep the service secure and working.",
  },
  {
    heading: "3. Payments",
    body: "Membership payments are processed by Razorpay. Your card, UPI or bank details are entered directly with Razorpay and are never stored on our servers. We receive only a confirmation of the payment, its amount and a transaction reference.",
  },
  {
    heading: "4. How we use your data",
    body: "We use your data to run your account, match you with relevant jobs, share your profile with employers in the way described below, process payments, send service emails such as renewal reminders, and respond to support requests. We do not sell your personal data.",
  },
  {
    heading: "5. What employers can see",
    body: "Employers see only your skills and experience. Your name, contact details, photograph and other identifying information stay hidden until you expressly agree to reveal them to a specific employer. Every reveal is logged.",
  },
  {
    heading: "6. Who we share data with",
    body: "We share data only with service providers that help us run JobClubb, such as our hosting, database, email and payment providers, and only to the extent they need it to provide their service. We may also disclose data where required by law.",
  },
  {
    heading: "7. Cookies",
    body: "We use essential cookies to keep you signed in and to remember your preferences. You can clear or block cookies in your browser, but parts of the site may not work without them.",
  },
  {
    heading: "8. Retention and security",
    body: "We keep your data only as long as your account is active or as needed to meet legal and accounting obligations. We use encrypted connections and access controls to protect it.",
  },
  {
    heading: "9. Your rights",
    body: "In line with the Digital Personal Data Protection Act, 2023, you may ask to access, correct or erase your personal data, and you may withdraw consent at any time. Write to contact@jobclubb.com and we will act on your request.",
  },
  {
    heading: "10. Changes to this policy",
    body: "We may update this policy from time to time. The date at the top of this page shows when it was last changed.",
  },
];

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      description="How we collect, use and protect your personal data."
      eyebrow="Last updated 9 October 2026"
      sections={SECTIONS}
      footnote="Last updated 9 October 2026"
    />
  );
}
