import { cookies } from "next/headers";

import { SignIn } from "@/components/sign-in/sign-in";
import { FRESH_JOBS } from "@/lib/home-data";
import {
  PENDING_EMAIL_COOKIE,
  rememberedEmailCookie,
} from "@/lib/supabase/session";

export const metadata = {
  title: "Sign in — JobClubb",
  description:
    "Sign in to your JobClubb candidate, company or franchise account.",
};

const ROLES = ["candidate", "company", "franchise"] as const;

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { as, next, error, verified, reset } = await searchParams;
  const initialRole = ROLES.find((r) => r === as) ?? "candidate";
  const cookieStore = await cookies();
  const verifiedEmail =
    verified === "1" || reset === "1"
      ? cookieStore.get(PENDING_EMAIL_COOKIE)?.value
      : undefined;
  const rememberedEmails = Object.fromEntries(
    ROLES.map((r) => [r, cookieStore.get(rememberedEmailCookie(r))?.value]),
  );
  return (
    <SignIn
      initialRole={initialRole}
      next={typeof next === "string" ? next : undefined}
      linkExpired={error === "link-expired"}
      verified={verified === "1"}
      passwordReset={reset === "1"}
      verifiedEmail={verifiedEmail}
      rememberedEmails={rememberedEmails}
      freshRoles={FRESH_JOBS.map((job) => job.role)}
    />
  );
}
