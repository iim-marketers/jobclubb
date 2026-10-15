import { checkSignUpCode } from "@/app/(auth)/sign-up/actions";
import { CandidateSignUp } from "@/components/sign-up/candidate-sign-up";

export const metadata = {
  title: "Create your account — JobClubb",
  description:
    "Create your JobClubb account and start applying to verified openings.",
  alternates: { canonical: "/sign-up" },
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code.trim().toUpperCase().slice(0, 24) : "";
  const emporium = initialCode ? await checkSignUpCode(initialCode) : null;

  return (
    <CandidateSignUp
      initialCode={initialCode || undefined}
      initialEmporium={emporium ? { code: initialCode, ...emporium } : undefined}
    />
  );
}
