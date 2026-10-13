"use client";

import { useRouter } from "next/navigation";

import { RazorpayCheckout } from "@/components/razorpay-checkout";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso));

export function MembershipCheckout({
  label,
  planName,
  prefill,
}: {
  label: string;
  planName: string;
  prefill: { name: string; email: string; contact: string };
}) {
  const router = useRouter();
  return (
    <RazorpayCheckout<{ invoice_number: string; paid_at: string; expires_at: string }>
      label={label}
      description={planName}
      prefill={prefill}
      orderUrl="/api/create-order"
      verifyUrl="/api/verify-payment"
      copy={{
        item: { label: "Plan", value: planName },
        successAction: "Go to dashboard",
        retryHint: "Your payment went through — retry to activate your membership.",
      }}
      successMessage={(r) =>
        `Welcome to JobClubb! Your ${planName} is active until ${formatDate(r.expires_at)}.`
      }
      onSuccessAction={() => {
        router.replace("/candidate/dashboard");
        router.refresh();
      }}
    />
  );
}
