import { CandidateSignUp } from "@/components/sign-up/candidate-sign-up";

export const metadata = {
  title: "Create your account — JobClubb",
  description:
    "Create your JobClubb account and start applying to verified openings.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return <CandidateSignUp />;
}
