import "server-only";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { Resume, ResumeContact } from "@/lib/resume";

const MUTED = "#525252";

const s = StyleSheet.create({
  page: {
    padding: "14mm",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#171717",
  },
  header: {
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
  },
  name: { fontSize: 18, lineHeight: 1.3, fontFamily: "Helvetica-Bold" },
  headline: { marginTop: 2, color: "#404040" },
  contact: { marginTop: 6, color: MUTED },
  section: { marginBottom: 12 },
  sectionTitle: {
    marginBottom: 5,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#737373",
  },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: MUTED },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  item: { marginBottom: 3 },
  job: { marginBottom: 9 },
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bulletMark: { width: 10 },
  bulletText: { flex: 1 },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return items.map((item, i) => (
    <View key={i} style={s.bullet} wrap={false}>
      <Text style={s.bulletMark}>•</Text>
      <Text style={s.bulletText}>{item}</Text>
    </View>
  ));
}

function ResumePdf({ resume, contact }: { resume: Resume; contact: ResumeContact }) {
  return (
    <Document title={`${contact.name} - Resume`} author={contact.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{contact.name}</Text>
          {resume.headline && <Text style={s.headline}>{resume.headline}</Text>}
          <Text style={s.contact}>
            {[contact.city, contact.phone, contact.email].filter(Boolean).join("  |  ")}
          </Text>
        </View>

        {resume.summary && (
          <Section title="Professional summary">
            <Text>{resume.summary}</Text>
          </Section>
        )}

        {resume.skills.length > 0 && (
          <Section title="Skills">
            {resume.skills.map((group) => (
              <Text key={group.category} style={s.item}>
                <Text style={s.bold}>{group.category}:</Text> {group.items.join(", ")}
              </Text>
            ))}
          </Section>
        )}

        {resume.experience.length > 0 && (
          <Section title="Work experience">
            {resume.experience.map((job, i) => (
              <View key={i} style={s.job}>
                <View style={s.row}>
                  <Text style={s.bold}>
                    {job.title}
                    {job.company && <Text style={{ fontFamily: "Helvetica" }}>, {job.company}</Text>}
                  </Text>
                  <Text style={s.muted}>{[job.start, job.end].filter(Boolean).join(" – ")}</Text>
                </View>
                {job.location && <Text style={s.muted}>{job.location}</Text>}
                <Bullets items={job.bullets} />
              </View>
            ))}
          </Section>
        )}

        {resume.education.length > 0 && (
          <Section title="Education">
            {resume.education.map((e, i) => (
              <View key={i} style={[s.row, s.item]}>
                <Text>
                  <Text style={s.bold}>{e.qualification}</Text>
                  {e.institution && `, ${e.institution}`}
                </Text>
                {e.year && <Text style={s.muted}>{e.year}</Text>}
              </View>
            ))}
          </Section>
        )}

        {resume.certifications.length > 0 && (
          <Section title="Certifications">
            <Bullets items={resume.certifications} />
          </Section>
        )}

        {resume.languages.length > 0 && (
          <Section title="Languages">
            <Text>{resume.languages.join(", ")}</Text>
          </Section>
        )}
      </Page>
    </Document>
  );
}

export function renderResumePdf(resume: Resume, contact: ResumeContact) {
  return renderToBuffer(<ResumePdf resume={resume} contact={contact} />);
}
