import "server-only";

import { renderEmail } from "@/lib/email/layout";
import { constitutionLabel } from "@/lib/franchise";
import { formatDateOnly, formatRupees } from "@/lib/placements";

export function franchiseOtpEmail({
  firstName,
  franchiseName,
  code,
  minutes,
  termsUrl,
  privacyUrl,
}: {
  firstName: string;
  franchiseName: string;
  code: string;
  minutes: number;
  termsUrl: string;
  privacyUrl: string;
}) {
  return renderEmail({
    subject: `${code} is your JobClubb verification code`,
    preheader: `${franchiseName} is registering you on JobClubb. Share this code with them to confirm.`,
    eyebrow: "Verify your email",
    heading: "Confirm your JobClubb account",
    greeting: `Hi ${firstName},`,
    paragraphs: [
      `${franchiseName}, a JobClubb franchise partner, is creating your candidate account. To confirm this email is yours, share this code with them or type it in on their screen.`,
    ],
    code: {
      label: "Your verification code",
      value: code,
      note: `Expires in ${minutes} minutes`,
    },
    closing: [
      "Didn't ask anyone to register you? Ignore this email and no account will be created.",
    ],
    fineprint: [
      [
        "By sharing this code, you agree to JobClubb's ",
        { label: "Terms & Conditions", href: termsUrl },
        " and ",
        { label: "Privacy Policy", href: privacyUrl },
        `, and to ${franchiseName} and JobClubb using the details you gave them to register you and help you find a job.`,
      ],
    ],
    footer: "You're receiving this because a JobClubb franchise partner entered this email address to register you.",
  });
}

export function franchiseWelcomeEmail({
  firstName,
  franchiseName,
  email,
  signInUrl,
  forgotPasswordUrl,
}: {
  firstName: string;
  franchiseName: string;
  email: string;
  signInUrl: string;
  forgotPasswordUrl: string;
}) {
  return renderEmail({
    subject: "Welcome to JobClubb: your account is ready",
    preheader: `${franchiseName} has registered you and your membership is active. Sign in with your email and the password you chose.`,
    eyebrow: "Welcome to JobClubb",
    heading: `Welcome, ${firstName}`,
    greeting: `Dear ${firstName},`,
    paragraphs: [
      `${franchiseName} has registered you on JobClubb, and your account is ready. Sign in with this email address and the password you chose at their outlet.`,
      "Your membership is active for a year: apply for jobs, build your ATS-ready resume and get your guaranteed interviews. Your receipt is in a separate email.",
    ],
    details: [{ label: "Your sign-in email", value: email }],
    cta: { label: "Sign in to JobClubb", url: signInUrl },
    closing: [`Forgot your password? Choose a new one at ${forgotPasswordUrl}.`],
    footer: "You're receiving this because a JobClubb franchise partner registered this email address.",
  });
}

export function franchiseSignedUpInternalEmail(f: {
  name: string;
  legalName: string;
  constitution: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  adminUrl: string;
}) {
  return renderEmail({
    subject: `New franchise sign-up: ${f.name}, ${f.city}`,
    preheader: `${f.ownerName} has applied to open a JobClubb franchise in ${f.city}.`,
    eyebrow: "Franchise sign-up",
    heading: "A new franchise is waiting for approval",
    greeting: "Dear Team,",
    paragraphs: [
      "Someone has signed up as a franchise partner. Get in touch about the agreement and franchise fee, then approve them from the admin panel with their territory and term.",
    ],
    details: [
      { label: "Outlet", value: f.name },
      { label: "Legal name", value: `${f.legalName} (${constitutionLabel(f.constitution)})` },
      { label: "Contact", value: f.ownerName },
      { label: "Email", value: f.email, href: `mailto:${f.email}` },
      { label: "Phone", value: f.phone, href: `tel:${f.phone}` },
      { label: "City", value: f.city },
    ],
    cta: { label: "Review in admin", url: f.adminUrl },
    footer: "Internal notification about a franchise sign-up on JobClubb.",
  });
}

export function franchiseApprovedEmail({
  ownerName,
  name,
  code,
  startsOn,
  signInUrl,
}: {
  ownerName: string;
  name: string;
  code: string;
  startsOn: string;
  signInUrl: string;
}) {
  return renderEmail({
    subject: `${name} is approved as a JobClubb franchise`,
    preheader: `Your franchise code is ${code}. Sign in to start registering candidates.`,
    eyebrow: "Franchise approved",
    heading: "Welcome to JobClubb",
    greeting: `Dear ${ownerName},`,
    paragraphs: [
      `${name} is now an approved JobClubb franchise partner. Sign in with the email and password you chose to open your dashboard.`,
      "Register candidates who visit your outlet from the dashboard: they confirm with a code we email them, choose a password, and pay the membership to JobClubb online from your dashboard. You earn half of their first membership fee and half of their placement fee.",
    ],
    details: [
      { label: "Franchise code", value: code },
      { label: "Agreement starts", value: formatDateOnly(startsOn) },
    ],
    cta: { label: "Sign in", url: signInUrl },
    footer: "You're receiving this because you signed up as a JobClubb franchise partner.",
  });
}

export function franchiseRejectedEmail({
  ownerName,
  note,
}: {
  ownerName: string;
  note: string;
}) {
  return renderEmail({
    subject: "Your JobClubb franchise application",
    preheader: "We couldn't approve your franchise application.",
    eyebrow: "Franchise application",
    heading: "We couldn't approve your application",
    greeting: `Dear ${ownerName},`,
    paragraphs: [
      "Thank you for your interest in becoming a JobClubb franchise partner. We're unable to approve your application at this time.",
      `Reason: ${note}`,
      "If you have questions, reply to support@jobclubb.com.",
    ],
    footer: "You're receiving this because you signed up as a JobClubb franchise partner.",
  });
}

export function franchisePayoutEmail({
  ownerName,
  franchiseName,
  amount,
  paidOn,
  reference,
  commissions,
  earningsUrl,
}: {
  ownerName: string;
  franchiseName: string;
  amount: number;
  paidOn: string;
  reference: string;
  commissions: number;
  earningsUrl: string;
}) {
  return renderEmail({
    subject: `Commission of ${formatRupees(amount)} paid to ${franchiseName}`,
    preheader: `We've transferred ${formatRupees(amount)} to your bank account.`,
    eyebrow: "Commission paid",
    heading: `${formatRupees(amount)} is on its way`,
    greeting: `Dear ${ownerName},`,
    paragraphs: [
      `We've transferred your commission for ${commissions} ${commissions === 1 ? "entry" : "entries"} to the bank account on record for ${franchiseName}.`,
      "If anything doesn't match, tell us within 15 days of your statement.",
    ],
    details: [
      { label: "Amount", value: formatRupees(amount) },
      { label: "Transfer date", value: formatDateOnly(paidOn) },
      { label: "Reference (UTR)", value: reference },
    ],
    cta: { label: "View earnings", url: earningsUrl },
    footer: "You're receiving this because you're a JobClubb franchise partner.",
  });
}
