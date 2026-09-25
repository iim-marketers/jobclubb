import type { Resume, ResumeContact } from "@/lib/resume";

export function ResumeDocument({
  resume,
  contact,
}: {
  resume: Resume;
  contact: ResumeContact;
}) {
  return (
    <article
      id="resume-print"
      className="mx-auto max-w-3xl space-y-5 rounded-lg bg-white p-5 text-[13px] leading-relaxed text-neutral-900 shadow-lg shadow-black/5 ring-1 ring-black/5 sm:p-10 print:max-w-none print:rounded-none print:shadow-none print:ring-0"
    >
      <header className="border-b border-neutral-300 pb-4">
        <h3 className="text-2xl font-bold tracking-tight">{contact.name}</h3>
        {resume.headline && (
          <p className="mt-0.5 font-medium text-neutral-700">
            {resume.headline}
          </p>
        )}
        <p className="mt-2 text-neutral-600">
          {[contact.city, contact.phone, contact.email]
            .filter(Boolean)
            .join("  |  ")}
        </p>
      </header>

      {resume.summary && (
        <ResumeSection title="Professional summary">
          <p>{resume.summary}</p>
        </ResumeSection>
      )}

      {resume.skills.length > 0 && (
        <ResumeSection title="Skills">
          <ul className="space-y-1">
            {resume.skills.map((group) => (
              <li key={group.category}>
                <span className="font-semibold">{group.category}:</span>{" "}
                {group.items.join(", ")}
              </li>
            ))}
          </ul>
        </ResumeSection>
      )}

      {resume.experience.length > 0 && (
        <ResumeSection title="Work experience">
          <div className="space-y-4">
            {resume.experience.map((job, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-semibold">
                    {job.title}
                    {job.company && (
                      <span className="font-normal">, {job.company}</span>
                    )}
                  </p>
                  <p className="text-neutral-600">
                    {[job.start, job.end].filter(Boolean).join(" – ")}
                  </p>
                </div>
                {job.location && (
                  <p className="text-neutral-600">{job.location}</p>
                )}
                {job.bullets.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5">
                    {job.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </ResumeSection>
      )}

      {resume.education.length > 0 && (
        <ResumeSection title="Education">
          <ul className="space-y-1.5">
            {resume.education.map((e, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-x-4"
              >
                <span>
                  <span className="font-semibold">{e.qualification}</span>
                  {e.institution && `, ${e.institution}`}
                </span>
                {e.year && <span className="text-neutral-600">{e.year}</span>}
              </li>
            ))}
          </ul>
        </ResumeSection>
      )}

      {resume.certifications.length > 0 && (
        <ResumeSection title="Certifications">
          <ul className="list-disc space-y-1 pl-5">
            {resume.certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </ResumeSection>
      )}

      {resume.languages.length > 0 && (
        <ResumeSection title="Languages">
          <p>{resume.languages.join(", ")}</p>
        </ResumeSection>
      )}
    </article>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid-page">
      <h4 className="mb-2 text-xs font-bold tracking-[0.12em] text-neutral-500 uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}
