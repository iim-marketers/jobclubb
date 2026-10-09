import { PolicyPage, type PolicySection } from "@/components/policy-page";

export const metadata = {
  title: "Refund & Cancellation Policy — JobClubb",
  description: "Refunds and cancellations for JobClubb memberships.",
};

const SECTIONS: PolicySection[] = [
  {
    heading: "1. What you pay for",
    body: "JobClubb Membership is a one-time payment that gives you access to member features for 365 days from the date of payment. It is a digital service; nothing is shipped. Access starts as soon as your payment is confirmed.",
  },
  {
    heading: "2. Cancellation",
    body: "Membership does not renew automatically, so there is nothing to cancel. When your year ends, your membership simply expires unless you choose to pay again. Your free profile remains available either way.",
  },
  {
    heading: "3. Refunds",
    body: "Because member features are unlocked immediately on payment, membership fees are non-refundable once your membership is active, except in the cases listed below.",
  },
  {
    heading: "4. When we will refund you",
    body: "We will issue a full refund if you were charged more than once for the same membership, if money was deducted but your membership was not activated, or if you request a refund within 7 days of payment and have not yet used any member feature such as applying to a job or generating a resume.",
  },
  {
    heading: "5. How to request a refund",
    body: "Email contact@jobclubb.com from your registered email address with your Razorpay payment ID and the reason for the request. We will reply within 3 working days.",
  },
  {
    heading: "6. Refund timeline",
    body: "Approved refunds are returned to the original payment method within 5–7 working days. Your bank may take a few more days to show the credit.",
  },
];

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      description="How refunds and cancellations work for JobClubb memberships."
      eyebrow="Last updated 9 October 2026"
      sections={SECTIONS}
      footnote="Last updated 9 October 2026"
    />
  );
}
