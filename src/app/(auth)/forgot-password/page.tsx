import { ForgotPassword } from "@/components/forgot-password/forgot-password";

export const metadata = {
  title: "Forgot password — JobClubb",
  description: "Reset the password for your JobClubb candidate, company or franchise account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const { as } = await searchParams;
  return (
    <ForgotPassword role={as === "company" || as === "franchise" ? as : "candidate"} />
  );
}
