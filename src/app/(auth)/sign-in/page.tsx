import { SignIn } from "@/components/sign-in/sign-in";

export const metadata = {
  title: "Sign in — JobClubb",
  description:
    "Sign in to your JobClubb candidate, company or franchise account.",
};

const ROLES = ["candidate", "company", "franchise"] as const;

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { as } = await searchParams;
  const initialRole = ROLES.find((r) => r === as) ?? "candidate";
  return <SignIn initialRole={initialRole} />;
}
