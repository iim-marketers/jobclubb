"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlanSubmit({
  children,
  highlighted,
  size = "lg",
}: {
  children: React.ReactNode;
  highlighted?: boolean;
  size?: "default" | "lg";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size={size}
      disabled={pending}
      variant={highlighted ? "default" : "outline"}
      className={cn(
        "w-full font-head",
        highlighted && "bg-brand text-brand-foreground hover:bg-brand-dark",
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
