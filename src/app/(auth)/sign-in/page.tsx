import { cookies } from "next/headers";

import { SignIn } from "@/components/sign-in/sign-in";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";

export const metadata = {
  title: "Sign in — JobClubb",
  description:
    "Sign in to your JobClubb candidate, company or franchise account.",
};

const ROLES = ["candidate", "company", "franchise"] as const;

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { as, next, error, verified } = await searchParams;
  const initialRole = ROLES.find((r) => r === as) ?? "candidate";
  const verifiedEmail =
    verified === "1"
      ? (await cookies()).get(PENDING_EMAIL_COOKIE)?.value
      : undefined;
  return (
    <SignIn
      initialRole={initialRole}
      next={typeof next === "string" ? next : undefined}
      linkExpired={error === "link-expired"}
      verified={verified === "1"}
      verifiedEmail={verifiedEmail}
    />
  );
}
