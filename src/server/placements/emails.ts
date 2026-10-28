import "server-only";

import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { COMPANY_SELECTED } from "@/components/company/nav";
import { sendEmail } from "@/lib/email/mailer";
import { applicationDeclinedEmail } from "@/lib/email/templates/application-declined";
import {
  offerClosedForCandidateEmail,
  offerSentEmail,
  placementCompanyEmail,
  placementInternalEmail,
} from "@/lib/email/templates/placement";
import {
  LEFT_REASONS,
  PLACEMENT_EMAIL,
  formatDateOnly,
  formatRupees,
  type Leaving,
} from "@/lib/placements";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

type PlacementEmailRow = {
  id: string;
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
      "id, monthly_salary, joining_date, offer_deadline, job_applications!placements_application_id_fkey (ref, job_title, company_name), candidates (first_name, last_name, email, phone), companies (contact_name, email, phone)",
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
            `${p.job_applications.company_name} has ${firstSubmission ? "uploaded" : "updated"} the offer for ${candidateName(p)}. Review the documents, contact the candidate, then send them the offer letter.`,
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

export function sendOfferSent(id: string) {
  return send("offer sent", async () => {
    const p = await load(id);
    if (!p?.joining_date) return [];
    const joining = formatDateOnly(p.joining_date);
    return [
      {
        to: p.candidates.email,
        ...offerSentEmail({
          firstName: p.candidates.first_name,
          email: p.candidates.email,
          jobTitle: p.job_applications.job_title,
          companyName: p.job_applications.company_name,
          joiningDate: p.joining_date,
          applicationUrl: applicationUrl(p),
        }),
      },
      {
        to: p.companies.email,
        ...placementCompanyEmail({
          contactName: p.companies.contact_name,
          email: p.companies.email,
          subject: `${candidateName(p)} has confirmed the offer for ${p.job_applications.job_title}`,
          heading: "Candidate confirmed",
          paragraphs: [
            `${candidateName(p)} has confirmed your offer for the ${p.job_applications.job_title} position, and JobClubb has sent them your offer letter. They're expected to join on ${joining}.`,
            "After the joining date, mark whether they joined from your Selected page.",
          ],
          cta: { label: "View selected candidates", url: companyUrl },
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
          ? offerClosedForCandidateEmail(role)
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

// Throws, so the reminder job can release its claim and retry.
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

export function sendLeavingReported(id: string, leaving: Leaving, replacementOwed: boolean) {
  return send("leaving reported", async () => {
    const p = await load(id);
    if (!p) return [];
    const internal = {
      to: PLACEMENT_EMAIL,
      ...placementInternalEmail({
        subject: `${replacementOwed ? "Replacement owed" : LEFT_REASONS[leaving.reason]}: ${candidateName(p)} at ${p.job_applications.company_name}`,
        heading: replacementOwed ? "A replacement is owed" : "The employer reported an exit",
        paragraphs: [
          `${p.job_applications.company_name} reported that ${candidateName(p)} is no longer employed as ${p.job_applications.job_title}. Last working day: ${formatDateOnly(leaving.leftOn)}.`,
          ...(replacementOwed
            ? [
                `They resigned on ${formatDateOnly(leaving.resignedOn!)}, within three months of joining, so JobClubb owes the company a replacement candidate. Refer one, then link them on the placement page.`,
              ]
            : []),
          ...(leaving.notes ? [`Employer's note: ${leaving.notes}`] : []),
        ],
        details: [
          ...roleDetails(p),
          { label: "Reason", value: LEFT_REASONS[leaving.reason] },
          ...(leaving.resignedOn
            ? [{ label: "Resigned on", value: formatDateOnly(leaving.resignedOn) }]
            : []),
        ],
        adminUrl: adminUrl(p),
      }),
    };
    if (!replacementOwed) return [internal];
    return [
      internal,
      {
        to: p.companies.email,
        ...placementCompanyEmail({
          contactName: p.companies.contact_name,
          email: p.companies.email,
          subject: `We'll refer a replacement for ${p.job_applications.job_title}`,
          heading: "A replacement is on its way",
          paragraphs: [
            `Thank you for letting us know that ${candidateName(p)} resigned. Because they resigned within three months of joining, JobClubb will refer a replacement candidate for the ${p.job_applications.job_title} position.`,
            "We'll screen and interview candidates as usual before referring them. Keep the job open, or reopen it, so candidates can apply.",
          ],
          cta: { label: "View selected candidates", url: companyUrl },
        }),
      },
    ];
  });
}
