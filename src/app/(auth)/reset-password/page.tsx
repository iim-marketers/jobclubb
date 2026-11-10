import { ResetPassword } from "@/components/forgot-password/reset-password";

export const metadata = {
  title: "Reset password — JobClubb",
  description: "Choose a new password for your JobClubb account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token_hash, as, welcome } = await searchParams;
  return (
    <ResetPassword
      tokenHash={typeof token_hash === "string" ? token_hash : ""}
      role={as === "company" || as === "franchise" ? as : "candidate"}
      welcome={welcome === "1"}
    />
  );
}
