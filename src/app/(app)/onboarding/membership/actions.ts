"use server";

import { redirect } from "next/navigation";

import { isMembershipPlan, plansFor } from "@/lib/membership";
import { createClient } from "@/lib/supabase/server";
import {
  CHOOSE_PLAN_PATH,
  requireCandidate,
} from "@/server/auth/current-candidate";
import { chooseMembershipPlan } from "@/server/candidates/membership";

export async function choosePlan(formData: FormData) {
  const plan = formData.get("plan");
  const candidate = await requireCandidate(CHOOSE_PLAN_PATH);
  if (!isMembershipPlan(plan) || !plansFor(candidate.code).includes(plan))
    redirect(`${CHOOSE_PLAN_PATH}?error=1`);

  const saved = await chooseMembershipPlan(
    await createClient(),
    candidate.id,
    plan,
  );
  if (!saved) redirect(`${CHOOSE_PLAN_PATH}?error=1`);

  // TODO: send paid plans to Razorpay checkout once payments are built.
  redirect("/candidate/dashboard");
}
