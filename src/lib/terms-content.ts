export const TERMS_VERSION = "2026.09.1";

export const TERMS_SECTIONS = [
  {
    heading: "1. About these terms",
    body: "These terms govern your use of JobClubb.com, a recruitment portal operated for the Airlines, Hospitality and Travel & Tourism sectors. By creating an account you agree to be bound by them.",
  },
  {
    heading: "2. Eligibility",
    body: "You must be at least 18 years old and legally permitted to work in the jurisdiction where you seek employment. Student membership additionally requires valid proof of current enrolment.",
  },
  {
    heading: "3. Your account",
    body: "You are responsible for the accuracy of the information on your profile and for keeping your login credentials secure. Accounts are personal and may not be shared or transferred.",
  },
  {
    heading: "4. Membership and payment",
    body: "Membership is billed in advance through our payment gateway. A renewal reminder is sent 15 days before expiry, with a further reminder closer to the expiry date. Your free profile remains available whether or not you hold a paid membership.",
  },
  {
    heading: "5. Referral codes",
    body: "Each paying member receives a unique referral code. The first five people who join using that code receive complimentary membership. Those complimentary members do not receive their own referral code. Codes may not be sold or advertised commercially.",
  },
  {
    heading: "6. What employers can see",
    body: "Employers see only your skills and experience. Your name, contact details, photograph and other identifying information remain hidden until you expressly agree to reveal them. Every reveal is logged.",
  },
  {
    heading: "7. Personal data",
    body: "We collect and process personal data in accordance with the Digital Personal Data Protection Act. We collect only what is necessary, retain it only as long as required, and act on requests to correct or erase your data. You may withdraw consent at any time.",
  },
  {
    heading: "8. Acceptable use",
    body: "You agree not to submit false information, impersonate another person, scrape the platform, or use JobClubb to advertise services unrelated to your own job search.",
  },
  {
    heading: "9. No guarantee of employment",
    body: "Membership benefits, including guaranteed interviews, are provided on a best-efforts basis subject to your eligibility for the roles concerned. JobClubb does not guarantee that you will be offered employment.",
  },
  {
    heading: "10. Changes and contact",
    body: "We may update these terms from time to time and will ask you to accept any material change. Questions can be sent to contact@jobclubb.com. By ticking the box below you confirm you have read this document in full.",
  },
];

/** Stable anchor id for a section heading, e.g. "1. About these terms" -> "about-these-terms". */
export function termsSlug(heading: string): string {
  return heading
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Heading without its leading number, for the table of contents. */
export function termsLabel(heading: string): string {
  return heading.replace(/^\d+\.\s*/, "");
}
