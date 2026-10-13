"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { applyToJob } from "@/server/applications/candidate";
import { sendApplicationReceived } from "@/server/applications/emails";
import { requireMember } from "@/server/auth/current-candidate";
import { acceptCurrentTerms, hasAcceptedCurrentTerms } from "@/server/auth/terms";

// Members who joined before the placement-fee terms accept them on their next
// application, so nobody is selected without having agreed to the fee.
export async function applyToJobAction(
  slug: string,
  acceptTerms = false,
): Promise<{ error?: string; needsTerms?: boolean }> {
  const candidate = await requireMember(`/jobs/${slug}`);

  try {
    if (acceptTerms) await acceptCurrentTerms("candidates", candidate.id);
    else if (!(await hasAcceptedCurrentTerms("candidates", candidate.id)))
      return { error: "Please accept the updated terms to apply.", needsTerms: true };
  } catch (error) {
    console.error("Checking candidate terms failed", error);
    return { error: "We couldn't send your application. Please try again." };
  }

  let result: Awaited<ReturnType<typeof applyToJob>>;
  try {
    result = await applyToJob(candidate, slug);
  } catch (error) {
    console.error("Applying to job failed", error);
    return { error: "We couldn't send your application. Please try again." };
  }
  if (!result.ok)
    return {
      error:
        result.reason === "no_resume"
          ? "Build your resume before applying."
          : "This job is no longer accepting applications.",
    };

  if (result.created) after(() => sendApplicationReceived(result.ref));

  revalidatePath(`/jobs/${slug}`);
  revalidatePath("/candidate", "layout");
  return {};
}
