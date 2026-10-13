import "server-only";

import { renderEmail } from "@/lib/email/layout";

export function candidateSelectedEmail({
  candidate,
  company,
  jobTitle,
  jobCity,
  applicationRef,
  rounds,
  selectedOn,
  adminUrl,
}: {
  candidate: { name: string; email: string; phone: string };
  company: { name: string; contactName: string; designation: string; email: string; phone: string };
  jobTitle: string;
  jobCity: string;
  applicationRef: string;
  rounds: number;
  selectedOn: string;
  adminUrl: string;
}) {
  return renderEmail({
    subject: `Candidate selected: ${candidate.name} for ${jobTitle} at ${company.name}`,
    preheader: `${company.name} has selected ${candidate.name} for ${jobTitle}.`,
    eyebrow: "Candidate selected",
    heading: `${candidate.name} has been selected`,
    greeting: "Dear Placement Team,",
    paragraphs: [
      `${company.name} has selected ${candidate.name} for the ${jobTitle} position after ${rounds} interview ${rounds === 1 ? "round" : "rounds"}.`,
      "The candidate hasn't been told yet. The company has been asked to upload the offer letter; once it's in, review it and release it to the candidate from the admin panel.",
    ],
    details: [
      { label: "Application ID", value: applicationRef },
      { label: "Position", value: jobTitle },
      { label: "Job location", value: jobCity },
      { label: "Selected on", value: selectedOn },
      { label: "Candidate", value: candidate.name },
      { label: "Candidate email", value: candidate.email, href: `mailto:${candidate.email}` },
      { label: "Candidate phone", value: candidate.phone },
      { label: "Company", value: company.name },
      { label: "Company contact", value: `${company.contactName}, ${company.designation}` },
      { label: "Contact email", value: company.email, href: `mailto:${company.email}` },
      { label: "Contact phone", value: company.phone },
    ],
    cta: { label: "Open placement", url: adminUrl },
    footer: "Internal notification sent when a company selects a candidate on JobClubb.",
  });
}
