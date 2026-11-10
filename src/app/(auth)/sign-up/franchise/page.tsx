import { FranchiseSignUp } from "@/components/sign-up/franchise-sign-up";

export const metadata = {
  title: "Franchise sign-up — JobClubb",
  description:
    "Sign up to run a JobClubb franchise outlet and earn from every candidate registration and placement in your area.",
  alternates: { canonical: "/sign-up/franchise" },
};

export default function FranchiseSignUpPage() {
  return <FranchiseSignUp />;
}
