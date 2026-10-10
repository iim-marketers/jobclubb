"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { applyToJobAction } from "@/app/(jobs)/jobs/[slug]/actions";
import { Button } from "@/components/ui/button";

export function ApplyNowButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  const apply = () =>
    startTransition(async () => {
      const { error } = await applyToJobAction(slug);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Application sent", {
        description: "Track its progress from your dashboard.",
      });
    });

  return (
    <Button className={className} disabled={pending} onClick={apply}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      {pending ? "Sending…" : "Apply now"}
    </Button>
  );
}
