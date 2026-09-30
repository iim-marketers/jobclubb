"use client";

import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PaymentStatus =
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "failed"; stage: "payment" | "verification"; message: string };

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

  // Only a failure can be dismissed: verifying is in flight, and after success
  // this page would redirect anyway, so the dashboard button is the way out.
  const dismissible = kind === "failed";

  return (
    <Dialog
      open={!!status}
      onOpenChange={(open) => {
        if (!open && dismissible) onClose();
      }}
      disablePointerDismissal={!dismissible}
    >
      <DialogContent showCloseButton={dismissible} className="gap-5 p-6 text-center sm:max-w-md">
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

        {kind === "success" && (
          <>
            <DialogHeader className="items-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-brand-accent/15">
                <CircleCheck className="size-9 text-good" />
              </span>
              <DialogTitle className="font-head text-xl font-extrabold tracking-tight">
                Payment successful
              </DialogTitle>
              <DialogDescription>
                Welcome to JobClubb! Your {planName} is active for the next
                year.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="-mx-6 -mb-6 px-6">
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
              <DialogDescription>{shown.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="-mx-6 -mb-6 px-6">
              <Button variant="outline" size="lg" onClick={onClose} className="font-head">
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
