import { ResetPassword } from "@/components/forgot-password/reset-password";

export const metadata = {
  title: "Reset password — JobClubb",
  description: "Choose a new password for your JobClubb account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token_hash, as } = await searchParams;
  return (
    <ResetPassword
      tokenHash={typeof token_hash === "string" ? token_hash : ""}
      role={as === "company" ? "company" : "candidate"}
    />
  );
}
