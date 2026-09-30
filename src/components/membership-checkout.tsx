"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  PaymentStatusDialog,
  type PaymentFailure,
  type PaymentStatus,
} from "@/components/payment-status-dialog";
import { Button } from "@/components/ui/button";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: { payment_id?: string; order_id?: string };
};

type RazorpayInstance = {
  open(): void;
  on(
    event: "payment.failed",
    handler: (response: { error: RazorpayFailure }) => void,
  ): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

async function postJson<T>(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 100 ? 2 : 0,
  }).format(amount / 100);
}

// Razorpay's own description is often just "Payment failed", so explain the
// failure from its reason/source/step fields where we can.
function explainFailure(error: RazorpayFailure) {
  const reason = error.reason ?? "";
  if (reason.includes("insufficient"))
    return "Your account doesn't have enough balance for this payment.";
  if (reason.includes("timed_out") || reason.includes("timeout"))
    return "The payment timed out before your bank confirmed it.";
  if (reason.includes("cancelled"))
    return "The payment was cancelled before it completed.";
  if (error.step === "payment_authentication" || reason.includes("authentication"))
    return "The OTP or bank verification wasn't completed.";
  if (error.source === "bank" || error.source === "issuer" || reason.includes("declined"))
    return "Your bank declined this payment.";
  const description = error.description?.trim().replace(/\.?$/, ".");
  return description && !/^payment failed\.$/i.test(description)
    ? description
    : "Your payment didn't go through.";
}

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
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  // Razorpay keeps its modal open after a failed attempt so the candidate can
  // retry; the failure is only reported once they close it.
  const lastFailure = useRef<PaymentFailure | null>(null);
  const lastPayment = useRef<RazorpayResponse | null>(null);
  const amount = useRef<string | undefined>(undefined);

  async function verify(response: RazorpayResponse) {
    lastPayment.current = response;
    setStatus({ kind: "verifying" });
    try {
      const receipt = await postJson<{
        invoice_number: string;
        paid_at: string;
        expires_at: string;
      }>("/api/verify-payment", response);
      setStatus({
        kind: "success",
        invoiceNumber: receipt.invoice_number,
        paymentId: response.razorpay_payment_id,
        amount: amount.current,
        paidAt: receipt.paid_at,
        expiresAt: receipt.expires_at,
      });
    } catch (err) {
      setStatus({
        kind: "failed",
        stage: "verification",
        message: (err as Error).message,
        amount: amount.current,
        paymentId: response.razorpay_payment_id,
      });
    }
  }

  function retry() {
    // A payment that went through but failed to verify is retried as-is, so
    // the candidate is never charged twice.
    if (status?.kind === "failed" && status.stage === "verification" && lastPayment.current)
      verify(lastPayment.current);
    else pay();
  }

  async function pay() {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!window.Razorpay || !keyId) {
      setError("Payment isn't available right now. Please try again soon.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);
    lastFailure.current = null;
    lastPayment.current = null;
    try {
      const order = await postJson<{
        order_id: string;
        amount: number;
        currency: string;
      }>("/api/create-order");
      amount.current = formatAmount(order.amount, order.currency);

      const checkout = new window.Razorpay({
        key: keyId,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "JobClubb",
        description: planName,
        prefill,
        theme: { color: "#00789f" },
        handler: verify,
        modal: {
          ondismiss: () => {
            setBusy(false);
            if (lastFailure.current)
              setStatus({ kind: "failed", stage: "payment", ...lastFailure.current });
            else
              setError("Payment cancelled. You can try again whenever you're ready.");
          },
        },
      });
      checkout.on("payment.failed", ({ error }) => {
        lastFailure.current = {
          message: explainFailure(error),
          amount: amount.current,
          paymentId: error.metadata?.payment_id,
        };
      });
      checkout.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setError("Couldn't load the payment window. Check your connection and reload.")
        }
      />
      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        disabled={busy || !scriptReady}
        onClick={pay}
        className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
      >
        {(busy || (!scriptReady && !error)) && <Loader2 className="size-4 animate-spin" />}
        {label}
      </Button>
      <PaymentStatusDialog
        status={status}
        planName={planName}
        onGoToDashboard={() => {
          router.replace("/candidate/dashboard");
          router.refresh();
        }}
        onRetry={retry}
        onClose={() => {
          setStatus(null);
          if (status?.kind === "failed" && status.stage === "verification")
            setBusy(false);
        }}
      />
    </>
  );
}
