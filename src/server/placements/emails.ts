import "server-only";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { COMPANY_SELECTED } from "@/components/company/nav";
import { sendEmail } from "@/lib/email/mailer";
import { applicationDeclinedEmail } from "@/lib/email/templates/application-declined";
import {
  offerClosedForCandidateEmail,
  offerPaymentReminderEmail,
  offerReleasedEmail,
  placementCompanyEmail,
  placementInternalEmail,
} from "@/lib/email/templates/placement";
import { PLACEMENT_EMAIL, formatDateOnly, formatRupees } from "@/lib/placements";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

type PlacementEmailRow = {
  id: string;
  fee_amount: number | null;
  monthly_salary: number | null;
  joining_date: string | null;
  offer_deadline: string | null;
  job_applications: { ref: string; job_title: string; company_name: string };
  candidates: { first_name: string; last_name: string; email: string; phone: string };
  companies: { contact_name: string; email: string; phone: string };
};

async function load(id: string) {
  const { data, error } = await createAdminClient()
    .from("placements")
    .select(
      "id, fee_amount, monthly_salary, joining_date, offer_deadline, job_applications (ref, job_title, company_name), candidates (first_name, last_name, email, phone), companies (contact_name, email, phone)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PlacementEmailRow | null;
}

const applicationUrl = (p: PlacementEmailRow) =>
  `${SITE_URL}${CANDIDATE_HOME}/applications/${p.job_applications.ref}`;
const adminUrl = (p: PlacementEmailRow) => `${SITE_URL}/admin/placements/${p.id}`;
const companyUrl = `${SITE_URL}${COMPANY_SELECTED}`;
const candidateName = (p: PlacementEmailRow) => `${p.candidates.first_name} ${p.candidates.last_name}`;

function roleDetails(p: PlacementEmailRow) {
  return [
    { label: "Application ID", value: p.job_applications.ref },
    { label: "Position", value: p.job_applications.job_title },
    { label: "Company", value: p.job_applications.company_name },
    { label: "Candidate", value: candidateName(p) },
  ];
}

// Called from after(), so failures are logged rather than surfaced to the user.
async function send(kind: string, build: () => Promise<Parameters<typeof sendEmail>[0][]>) {
  try {
    for (const message of await build()) await sendEmail(message);
  } catch (error) {
    console.error(`Sending ${kind} email failed`, error);
  }
}

export function sendOfferUploaded(id: string, firstSubmission: boolean) {
  return send("offer uploaded", async () => {
    const p = await load(id);
    if (!p) return [];
    return [
      {
        to: PLACEMENT_EMAIL,
        ...placementInternalEmail({
          subject: `${firstSubmission ? "Offer uploaded" : "Offer updated"}: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: firstSubmission ? "An offer is ready to review" : "An offer was updated",
          paragraphs: [
            `${p.job_applications.company_name} has ${firstSubmission ? "uploaded" : "updated"} the offer for ${candidateName(p)}. Review the documents and release it to the candidate.`,
          ],
          details: [
            ...roleDetails(p),
            ...(p.monthly_salary
              ? [{ label: "Monthly gross", value: formatRupees(p.monthly_salary) }]
              : []),
            ...(p.joining_date ? [{ label: "Joining date", value: formatDateOnly(p.joining_date) }] : []),
          ],
          adminUrl: adminUrl(p),
        }),
      },
    ];
  });
}

export function sendOfferReleased(id: string) {
  return send("offer released", async () => {
    const p = await load(id);
    if (!p?.fee_amount || !p.offer_deadline || !p.joining_date) return [];
    return [
      {
        to: p.candidates.email,
        ...offerReleasedEmail({
          firstName: p.candidates.first_name,
          email: p.candidates.email,
          jobTitle: p.job_applications.job_title,
          companyName: p.job_applications.company_name,
          fee: p.fee_amount,
          deadline: p.offer_deadline,
          joiningDate: p.joining_date,
          applicationUrl: applicationUrl(p),
        }),
      },
    ];
  });
}

export function sendPlacementPaid(id: string) {
  return send("placement paid", async () => {
    const p = await load(id);
    if (!p) return [];
    const joining = p.joining_date ? formatDateOnly(p.joining_date) : "the agreed date";
    return [
      {
        to: p.companies.email,
        ...placementCompanyEmail({
          contactName: p.companies.contact_name,
          email: p.companies.email,
          subject: `${candidateName(p)} has confirmed the offer for ${p.job_applications.job_title}`,
          heading: "Candidate confirmed",
          paragraphs: [
            `${candidateName(p)} has confirmed your offer for the ${p.job_applications.job_title} position and is expected to join on ${joining}.`,
            "After the joining date, mark whether they joined from your Selected page.",
          ],
          cta: { label: "View selected candidates", url: companyUrl },
        }),
      },
      {
        to: PLACEMENT_EMAIL,
        ...placementInternalEmail({
          subject: `Placement fee received: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: "Placement fee received",
          paragraphs: [`${candidateName(p)} has paid the placement fee and the offer is unlocked.`],
          details: [
            ...roleDetails(p),
            ...(p.fee_amount ? [{ label: "Fee paid", value: formatRupees(p.fee_amount) }] : []),
            { label: "Joining date", value: joining },
          ],
          adminUrl: adminUrl(p),
        }),
      },
    ];
  });
}

export function sendLatePaymentAlert(id: string, paymentId: string) {
  return send("late placement payment", async () => {
    const p = await load(id);
    if (!p) return [];
    return [
      {
        to: PLACEMENT_EMAIL,
        ...placementInternalEmail({
          subject: `Action needed: unexpected placement fee from ${candidateName(p)}`,
          heading: "A fee was paid for an offer that wasn't open",
          paragraphs: [
            `${candidateName(p)} paid the placement fee, but the offer had already been paid, declined, withdrawn or had expired, so nothing was unlocked. Contact them and refund any duplicate payment.`,
          ],
          details: [...roleDetails(p), { label: "Payment ID", value: paymentId }],
          adminUrl: adminUrl(p),
        }),
      },
    ];
  });
}

export function sendOfferDeclined(id: string) {
  return send("offer declined", async () => {
    const p = await load(id);
    if (!p) return [];
    return [
      {
        to: p.companies.email,
        ...placementCompanyEmail({
          contactName: p.companies.contact_name,
          email: p.companies.email,
          subject: `${candidateName(p)} has declined the offer for ${p.job_applications.job_title}`,
          heading: "Offer declined",
          paragraphs: [
            `${candidateName(p)} has decided not to take up your offer for the ${p.job_applications.job_title} position.`,
            "You can keep reviewing other applicants for this role from your dashboard.",
          ],
          cta: { label: "View selected candidates", url: companyUrl },
        }),
      },
      {
        to: PLACEMENT_EMAIL,
        ...placementInternalEmail({
          subject: `Offer declined: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: "The candidate declined",
          paragraphs: [`${candidateName(p)} declined the offer before paying the placement fee.`],
          details: roleDetails(p),
          adminUrl: adminUrl(p),
        }),
      },
    ];
  });
}

export function sendPlacementWithdrawn(id: string, candidateWasTold: boolean, byCompany: boolean) {
  return send("placement withdrawn", async () => {
    const p = await load(id);
    if (!p) return [];
    const role = {
      firstName: p.candidates.first_name,
      email: p.candidates.email,
      jobTitle: p.job_applications.job_title,
      companyName: p.job_applications.company_name,
    };
    // Withdrawn before the release reads to the candidate as not selected.
    const messages = [
      {
        to: p.candidates.email,
        ...(candidateWasTold
          ? offerClosedForCandidateEmail({ ...role, reason: "withdrawn" })
          : applicationDeclinedEmail({ ...role, afterInterview: true })),
      },
    ];
    if (byCompany)
      messages.push({
        to: PLACEMENT_EMAIL,
        ...placementInternalEmail({
          subject: `Offer withdrawn: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: "The company withdrew an offer",
          paragraphs: [
            `${p.job_applications.company_name} withdrew the offer for ${candidateName(p)}.${candidateWasTold ? " The candidate had already been told they were selected." : ""}`,
          ],
          details: roleDetails(p),
          adminUrl: adminUrl(p),
        }),
      });
    else
      messages.push({
        to: p.companies.email,
        ...placementCompanyEmail({
          contactName: p.companies.contact_name,
          email: p.companies.email,
          subject: `Offer withdrawn: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: "The offer was withdrawn",
          paragraphs: [
            `JobClubb has withdrawn the offer for ${candidateName(p)} for the ${p.job_applications.job_title} position, and the candidate has been told.`,
            "If you didn't expect this, reply to this email.",
          ],
          cta: { label: "View selected candidates", url: companyUrl },
        }),
      });
    return messages;
  });
}

// The two reminders below throw, so the reminder job can release its claim and retry.

export async function sendPaymentReminder(id: string, final: boolean) {
  const p = await load(id);
  if (!p?.fee_amount || !p.offer_deadline) return;
  await sendEmail({
    to: p.candidates.email,
    ...offerPaymentReminderEmail({
      firstName: p.candidates.first_name,
      email: p.candidates.email,
      jobTitle: p.job_applications.job_title,
      companyName: p.job_applications.company_name,
      fee: p.fee_amount,
      deadline: p.offer_deadline,
      final,
      applicationUrl: applicationUrl(p),
    }),
  });
}

export async function sendOfferUploadReminder(id: string) {
  const p = await load(id);
  if (!p) return;
  await sendEmail({
    to: p.companies.email,
    ...placementCompanyEmail({
      contactName: p.companies.contact_name,
      email: p.companies.email,
      subject: `Upload the offer letter for ${candidateName(p)}`,
      heading: "Your selected candidate is waiting",
      paragraphs: [
        `You selected ${candidateName(p)} for the ${p.job_applications.job_title} position. Upload their offer letter so JobClubb can share it with them.`,
      ],
      cta: { label: "Upload offer letter", url: companyUrl },
    }),
  });
}

export function sendOfferExpired(id: string) {
  return send("offer expired", async () => {
    const p = await load(id);
    if (!p) return [];
    return [
      {
        to: p.candidates.email,
        ...offerClosedForCandidateEmail({
          firstName: p.candidates.first_name,
          email: p.candidates.email,
          jobTitle: p.job_applications.job_title,
          companyName: p.job_applications.company_name,
          reason: "expired",
        }),
      },
      {
        to: p.companies.email,
        ...placementCompanyEmail({
          contactName: p.companies.contact_name,
          email: p.companies.email,
          subject: `Offer lapsed: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: "The offer lapsed",
          paragraphs: [
            `${candidateName(p)} didn't confirm your offer for the ${p.job_applications.job_title} position by the deadline, so it has lapsed.`,
            "You can keep reviewing other applicants for this role from your dashboard.",
          ],
          cta: { label: "View selected candidates", url: companyUrl },
        }),
      },
      {
        to: PLACEMENT_EMAIL,
        ...placementInternalEmail({
          subject: `Offer expired: ${candidateName(p)} for ${p.job_applications.job_title}`,
          heading: "An offer expired unpaid",
          paragraphs: [
            `The deadline for ${candidateName(p)} passed without payment. You can extend it from the placement page if they still want the role.`,
          ],
          details: roleDetails(p),
          adminUrl: adminUrl(p),
        }),
      },
    ];
  });
}
