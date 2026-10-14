"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { declineOffer } from "@/app/(app)/candidate/dashboard/applications/[id]/actions";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PayOfferButton({
  placementId,
  label,
  jobTitle,
  prefill,
}: {
  placementId: string;
  label: string;
  jobTitle: string;
  prefill: { name: string; email: string; contact: string };
}) {
  const router = useRouter();
  return (
    <RazorpayCheckout<{ invoice_number: string; paid_at: string; accepted: boolean }>
      label={label}
      className="h-auto min-h-11 py-2 whitespace-normal"
      description={`Placement fee: ${jobTitle}`}
      prefill={prefill}
      orderUrl={`/api/placements/${placementId}/order`}
      verifyUrl="/api/placements/verify"
      copy={{
        item: { label: "For", value: jobTitle },
        successAction: "View offer letter",
        retryHint: "Your payment went through — retry to unlock your offer.",
      }}
      successMessage={(r) =>
        r.accepted
          ? "Your offer letter and joining details are unlocked. We've emailed your invoice."
          : "We received your payment, but this offer had already closed. Our placement team will contact you."
      }
      onSuccessAction={() => router.refresh()}
    />
  );
}

export function DeclineOfferButton({
  placementId,
  companyName,
}: {
  placementId: string;
  companyName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const decline = () =>
    startTransition(async () => {
      const { error } = await declineOffer(placementId);
      if (error) {
        toast.error(error);
        return;
      }
      setOpen(false);
      toast.success("Offer declined");
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger
        render={<Button variant="destructive" size="lg" className="w-full font-head" />}
      >
        Decline offer
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-head text-lg font-bold">Decline this offer?</DialogTitle>
          <DialogDescription>
            We&apos;ll let {companyName} know you won&apos;t be joining. You
            won&apos;t be charged, and this can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose disabled={pending} render={<Button variant="outline" className="font-head" />}>
            Keep offer
          </DialogClose>
          <Button variant="destructive" className="font-head" disabled={pending} onClick={decline}>
            {pending ? "Declining…" : "Decline offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
