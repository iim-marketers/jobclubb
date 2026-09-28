import { ResetPassword } from "@/components/forgot-password/reset-password";

export const metadata = {
  title: "Reset password — JobClubb",
  description: "Choose a new password for your JobClubb candidate account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token_hash } = await searchParams;
  return <ResetPassword tokenHash={typeof token_hash === "string" ? token_hash : ""} />;
}
