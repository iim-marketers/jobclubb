"use server";

import { revalidatePath } from "next/cache";

import { applyToJob } from "@/server/applications/candidate";
import { requireMember } from "@/server/auth/current-candidate";

export async function applyToJobAction(slug: string): Promise<{ error?: string }> {
  const candidate = await requireMember(`/jobs/${slug}`);

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

  revalidatePath(`/jobs/${slug}`);
  revalidatePath("/candidate", "layout");
  return {};
}
