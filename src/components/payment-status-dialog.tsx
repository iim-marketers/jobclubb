"use client";

import confetti from "canvas-confetti";
import { useEffect, useState, type ReactNode } from "react";
import { Check, CircleCheck, CircleX, Copy, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PaymentFailure = {
  message: string;
  amount?: string;
  paymentId?: string;
};

export type PaymentReceipt = {
  invoiceNumber: string;
  paymentId: string;
  amount?: string;
  paidAt: string;
  expiresAt: string;
};

export type PaymentStatus =
  | { kind: "verifying" }
  | ({ kind: "success" } & PaymentReceipt)
  | ({ kind: "failed"; stage: "payment" | "verification" } & PaymentFailure);

const CONFETTI_COLORS = ["#00789f", "#00bea2", "#38b6dd", "#ffd166"];

function celebrate() {
  const end = Date.now() + 1500;
  const burst = () => {
    for (const [x, angle] of [
      [0, 60],
      [1, 120],
    ]) {
      confetti({
        particleCount: 6,
        angle,
        spread: 70,
        origin: { x, y: 0.7 },
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      });
    }
    if (Date.now() < end) requestAnimationFrame(burst);
  };
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
  });
  burst();
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(iso),
  );

function CopyableId({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex min-w-0 items-center justify-end gap-1">
      <span className="truncate font-mono text-xs">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={copied ? "Copied" : `Copy ${label}`}
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <Check className="text-good" /> : <Copy />}
      </Button>
    </span>
  );
}

function PaymentDetails({
  rows,
}: {
  rows: (readonly [string, ReactNode] | false | undefined | "")[];
}) {
  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-muted/40 text-left text-sm">
      {rows.filter(Boolean).map((row) => {
        const [label, value] = row as readonly [string, ReactNode];
        return (
          <div
            key={label}
            className="flex min-h-10 items-center justify-between gap-4 px-3 py-2"
          >
            <dt className="flex-none text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-right font-medium">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function PaymentStatusDialog({
  status,
  planName,
  onGoToDashboard,
  onRetry,
  onClose,
}: {
  status: PaymentStatus | null;
  planName: string;
  onGoToDashboard: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  // Keep showing the last status while the dialog animates closed.
  const [shown, setShown] = useState(status);
  if (status && status !== shown) setShown(status);
  const kind = shown?.kind;

  useEffect(() => {
    if (status?.kind !== "success") return;
    celebrate();
    return () => {
      confetti.reset();
    };
  }, [status?.kind]);

  const dismissible = kind === "failed";

  return (
    <Dialog
      open={!!status}
      onOpenChange={(open) => {
        if (!open && dismissible) onClose();
      }}
      disablePointerDismissal={!dismissible}
    >
      <DialogContent
        showCloseButton={dismissible}
        className="gap-5 p-6 text-center sm:max-w-md"
      >
        {kind === "verifying" && (
          <DialogHeader className="items-center gap-3">
            <Loader2 className="size-12 animate-spin text-brand" />
            <DialogTitle className="font-head text-lg font-bold">
              Confirming your payment
            </DialogTitle>
            <DialogDescription>
              This takes a few seconds. Please don&apos;t close this page.
            </DialogDescription>
          </DialogHeader>
        )}

        {shown?.kind === "success" && (
          <>
            <DialogHeader className="items-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-brand-accent/15">
                <CircleCheck className="size-9 text-good" />
              </span>
              <DialogTitle className="font-head text-xl font-extrabold tracking-tight">
                Payment successful
              </DialogTitle>
              <DialogDescription className="text-balance">
                Welcome to JobClubb! Your {planName} is active until{" "}
                {formatDate(shown.expiresAt)}.
              </DialogDescription>
            </DialogHeader>

            <PaymentDetails
              rows={[
                [
                  "Invoice no.",
                  <CopyableId
                    key="invoice"
                    value={shown.invoiceNumber}
                    label="invoice number"
                  />,
                ],
                ["Plan", planName],
                shown.amount && ["Amount paid", shown.amount],
                ["Paid on", formatDate(shown.paidAt)],
                [
                  "Payment ID",
                  <CopyableId
                    key="payment"
                    value={shown.paymentId}
                    label="payment ID"
                  />,
                ],
              ]}
            />

            <DialogFooter className="-mx-6 -mb-6 px-6 py-4">
              <Button
                size="lg"
                onClick={onGoToDashboard}
                className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              >
                Go to dashboard
              </Button>
            </DialogFooter>
          </>
        )}

        {shown?.kind === "failed" && (
          <>
            <DialogHeader className="items-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <CircleX className="size-9 text-destructive" />
              </span>
              <DialogTitle className="font-head text-xl font-extrabold tracking-tight">
                {shown.stage === "payment"
                  ? "Payment failed"
                  : "We couldn't confirm your payment"}
              </DialogTitle>
              <DialogDescription className="text-balance">
                {shown.message}{" "}
                {shown.stage === "payment"
                  ? "You can try again or use a different payment method."
                  : "Your payment went through — retry to activate your membership."}
              </DialogDescription>
            </DialogHeader>

            <PaymentDetails
              rows={[
                ["Plan", planName],
                shown.amount && ["Amount", shown.amount],
                shown.paymentId && [
                  "Reference ID",
                  <CopyableId
                    key="id"
                    value={shown.paymentId}
                    label="reference ID"
                  />,
                ],
              ]}
            />

            {shown.stage === "payment" && shown.paymentId && (
              <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-left text-xs leading-5 text-destructive">
                <Info className="mt-0.5 size-3.5 flex-none text-destructive" />
                You haven&apos;t been charged. If your bank shows a debit, it
                will be reversed within 5–7 working days. Share the reference ID
                if you contact support.
              </p>
            )}

            <DialogFooter className="-mx-6 -mb-6 grid grid-cols-2 gap-3 px-6 py-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onClose}
                className="font-head"
              >
                Close
              </Button>
              <Button
                size="lg"
                onClick={onRetry}
                className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
              >
                {shown.stage === "payment" ? "Try again" : "Retry confirmation"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
