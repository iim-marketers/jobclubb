import { ForgotPassword } from "@/components/forgot-password/forgot-password";

export const metadata = {
  title: "Forgot password — JobClubb",
  description: "Reset the password for your JobClubb candidate or company account.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const { as } = await searchParams;
  return <ForgotPassword role={as === "company" ? "company" : "candidate"} />;
}
