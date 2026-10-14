import "server-only";

import { COMPANY_HOME } from "@/components/company/nav";
import { SUPPORT_EMAIL, changeFieldLabel } from "@/lib/company-change-requests";
import { sendEmail } from "@/lib/email/mailer";
import {
  changeRequestedInternalEmail,
  changeReviewedEmail,
} from "@/lib/email/templates/company-change";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

type ChangeEmailRow = {
  company_id: string;
  company_name: string;
  field: string;
  old_value: string | null;
  new_value: string;
  reason: string;
  status: string;
  admin_note: string | null;
  companies: { contact_name: string; email: string };
};

async function load(id: string) {
  const { data, error } = await createAdminClient()
    .from("company_change_requests")
    .select(
      "company_id, company_name, field, old_value, new_value, reason, status, admin_note, companies (contact_name, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ChangeEmailRow | null;
}

const change = (r: ChangeEmailRow) => ({
  companyName: r.company_name,
  fieldLabel: changeFieldLabel(r.field),
  oldValue: r.old_value,
  newValue: r.new_value,
});

// Called from after(), so failures are logged rather than surfaced to the user.
async function send(kind: string, build: () => Promise<Parameters<typeof sendEmail>[0] | null>) {
  try {
    const message = await build();
    if (message) await sendEmail(message);
  } catch (error) {
    console.error(`Sending ${kind} email failed`, error);
  }
}

export function sendChangeRequested(id: string) {
  return send("change requested", async () => {
    const r = await load(id);
    if (!r) return null;
    return {
      to: SUPPORT_EMAIL,
      ...changeRequestedInternalEmail({
        ...change(r),
        contactName: r.companies.contact_name,
        email: r.companies.email,
        reason: r.reason,
        adminUrl: `${SITE_URL}/admin/companies?company=${r.company_id}`,
      }),
    };
  });
}

export function sendChangeReviewed(id: string) {
  return send("change reviewed", async () => {
    const r = await load(id);
    if (!r || (r.status !== "approved" && r.status !== "rejected")) return null;
    return {
      to: r.companies.email,
      ...changeReviewedEmail({
        ...change(r),
        contactName: r.companies.contact_name,
        email: r.companies.email,
        approved: r.status === "approved",
        adminNote: r.admin_note,
        settingsUrl: `${SITE_URL}${COMPANY_HOME}/settings#verified`,
      }),
    };
  });
}
