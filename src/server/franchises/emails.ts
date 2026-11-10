import "server-only";

import { SUPPORT_EMAIL } from "@/lib/company-change-requests";
import { sendEmail } from "@/lib/email/mailer";
import {
  franchiseApprovedEmail,
  franchisePayoutEmail,
  franchiseRejectedEmail,
  franchiseSignedUpInternalEmail,
} from "@/lib/email/templates/franchise";
import { FRANCHISE_EARNINGS } from "@/lib/franchise";
import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";

export async function sendPayoutEmail(payoutId: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("franchise_payouts")
      .select("amount, paid_on, reference, franchises (name, owner_name, email), franchise_commissions (count)")
      .eq("id", payoutId)
      .single();
    if (error) throw error;
    const franchise = data.franchises as unknown as { name: string; owner_name: string; email: string };
    const commissions = (data.franchise_commissions as unknown as { count: number }[])[0]?.count ?? 0;

    await sendEmail({
      to: franchise.email,
      ...franchisePayoutEmail({
        ownerName: franchise.owner_name,
        franchiseName: franchise.name,
        amount: data.amount,
        paidOn: data.paid_on,
        reference: data.reference,
        commissions,
        earningsUrl: `${SITE_URL}${FRANCHISE_EARNINGS}`,
      }),
    });
  } catch (error) {
    console.error("Sending franchise payout email failed", error);
  }
}

async function loadFranchise(id: string) {
  const { data, error } = await createAdminClient()
    .from("franchises")
    .select("status, name, legal_name, constitution, owner_name, email, phone, city, code, starts_on, review_note")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function sendNewFranchiseEmail(id: string) {
  try {
    const f = await loadFranchise(id);
    await sendEmail({
      to: SUPPORT_EMAIL,
      ...franchiseSignedUpInternalEmail({
        name: f.name,
        legalName: f.legal_name,
        constitution: f.constitution,
        ownerName: f.owner_name,
        email: f.email,
        phone: f.phone,
        city: f.city,
        adminUrl: `${SITE_URL}/admin/franchises/${id}`,
      }),
    });
  } catch (error) {
    console.error("Sending franchise sign-up notification failed", error);
  }
}

export async function sendFranchiseReviewedEmail(id: string) {
  try {
    const f = await loadFranchise(id);
    const email =
      f.status === "approved" && f.code && f.starts_on
        ? franchiseApprovedEmail({
            ownerName: f.owner_name,
            name: f.name,
            code: f.code,
            startsOn: f.starts_on,
            signInUrl: `${SITE_URL}/sign-in?as=franchise`,
          })
        : franchiseRejectedEmail({ ownerName: f.owner_name, note: f.review_note ?? "Not given." });
    await sendEmail({ to: f.email, ...email });
  } catch (error) {
    console.error("Sending franchise review email failed", error);
  }
}
