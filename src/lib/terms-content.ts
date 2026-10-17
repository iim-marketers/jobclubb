export const TERMS_VERSION = "2026.10.1";

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
    heading: "6. Placement fee",
    body: "When an employer selects you for a role you applied to through JobClubb, the employer gives the offer to JobClubb and JobClubb shares it with you. To receive the offer letter and joining details, you pay JobClubb a one-time placement fee equal to one month's fixed gross salary stated in the offer, with GST included. The fee is paid in full, through our payment gateway, by the deadline shown with the offer (normally 7 days, and never later than the joining date). If it isn't paid by then, the offer lapses. You may decline an offer at no cost before paying. Once paid, the placement fee is non-refundable in all cases, including if you do not join or the employer later withdraws the offer.",
  },
  {
    heading: "7. What employers can see",
    body: "Employers see only your skills and experience. Your name, contact details, photograph and other identifying information remain hidden until you expressly agree to reveal them. Every reveal is logged.",
  },
  {
    heading: "8. Personal data",
    body: "We collect and process personal data in accordance with the Digital Personal Data Protection Act. We collect only what is necessary, retain it only as long as required, and act on requests to correct or erase your data. You may withdraw consent at any time.",
  },
  {
    heading: "9. Acceptable use",
    body: "You agree not to submit false information, impersonate another person, scrape the platform, or use JobClubb to advertise services unrelated to your own job search.",
  },
  {
    heading: "10. No guarantee of employment",
    body: "Membership benefits, including guaranteed interviews, are provided on a best-efforts basis subject to your eligibility for the roles concerned. JobClubb does not guarantee that you will be offered employment.",
  },
  {
    heading: "11. Changes and contact",
    body: "We may update these terms from time to time and will ask you to accept any material change. Questions can be sent to support@jobclubb.com. By ticking the box below you confirm you have read this document in full.",
  },
];

// Employers sign up under their own terms. The candidate placement fee is a
// matter between the candidate and JobClubb, so it must never appear here.
export const EMPLOYER_TERMS_VERSION = "2026.10.2";

export const EMPLOYER_TERMS_SECTIONS = [
  {
    heading: "1. About these terms",
    body: "These terms govern how employers use JobClubb.com to post jobs and hire for the Airlines, Hospitality and Travel & Tourism sectors. By creating an employer account you agree to be bound by them.",
  },
  {
    heading: "2. Your account",
    body: "Each property or office registers its own account with its own email address. You are responsible for the accuracy of your company details and for keeping your login credentials secure. Accounts may not be shared or transferred.",
  },
  {
    heading: "3. Job postings",
    body: "Postings must describe genuine, current vacancies at your property, with accurate role, location and pay details, or pay marked as not disclosed. Postings must not discriminate unlawfully. We may edit or remove postings that break these terms.",
  },
  {
    heading: "4. Candidate privacy",
    body: "Candidates are shown to you by their skills and experience. Their name appears once you shortlist them. Their email address and phone number are never shared with you; JobClubb handles communication with candidates about offers.",
  },
  {
    heading: "5. Interviews and selection",
    body: "You schedule interviews and record their outcomes on JobClubb. When you select a candidate, you upload the offer letter and its key terms on JobClubb, and JobClubb shares the offer with the candidate. You record on JobClubb whether the candidate joined, and you promptly report on JobClubb if they later resign, are terminated or stop working with you for any other reason.",
  },
  {
    heading: "6. Replacement if a candidate resigns",
    body: "If a candidate placed through JobClubb voluntarily resigns within three months of their joining date, JobClubb will refer one replacement candidate for the role, screened and interviewed in the usual way. You must promptly notify JobClubb of the resignation, with the date they resigned. This applies once per original placement: it does not apply to a replacement candidate who later resigns, or where the candidate is terminated or their employment ends for another reason.",
  },
  {
    heading: "7. Offers through JobClubb",
    body: "Every offer to a candidate you found on JobClubb is made through JobClubb. You agree not to send the offer to the candidate, or contact the candidate about the role, outside JobClubb. If you hire a candidate introduced through JobClubb within 12 months of their application without going through JobClubb, you owe JobClubb a fee equal to one month's fixed gross salary of that candidate.",
  },
  {
    heading: "8. Personal data",
    body: "You may use candidate information only to assess candidates for the role they applied to, in line with the Digital Personal Data Protection Act. You must not copy it out of JobClubb, share it with third parties or keep it longer than needed for that hiring decision.",
  },
  {
    heading: "9. Acceptable use",
    body: "You agree not to submit false information, impersonate another organisation, scrape the platform, or use JobClubb for anything other than hiring for your own property.",
  },
  {
    heading: "10. Changes and contact",
    body: "We may update these terms from time to time and will ask you to accept any material change. Questions can be sent to support@jobclubb.com. By ticking the box below you confirm you have read this document in full.",
  },
];

export function termsSlug(heading: string): string {
  return heading
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function termsLabel(heading: string): string {
  return heading.replace(/^\d+\.\s*/, "");
}
