"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  PaymentStatusDialog,
  type PaymentStatus,
} from "@/components/payment-status-dialog";
import { Button } from "@/components/ui/button";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open(): void;
  on(
    event: "payment.failed",
    handler: (response: { error: { description?: string } }) => void,
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
  const lastFailure = useRef<string | null>(null);
  const lastPayment = useRef<RazorpayResponse | null>(null);

  async function verify(response: RazorpayResponse) {
    lastPayment.current = response;
    setStatus({ kind: "verifying" });
    try {
      await postJson("/api/verify-payment", response);
      setStatus({ kind: "success" });
    } catch (err) {
      setStatus({
        kind: "failed",
        stage: "verification",
        message: (err as Error).message,
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
              setStatus({
                kind: "failed",
                stage: "payment",
                message: lastFailure.current,
              });
            else
              setError("Payment cancelled. You can try again whenever you're ready.");
          },
        },
      });
      checkout.on("payment.failed", ({ error }) => {
        lastFailure.current = `${
          error.description ?? "Your payment didn't go through."
        } If any amount was debited, your bank will refund it automatically.`;
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
