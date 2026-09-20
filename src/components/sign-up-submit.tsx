"use client";

import { useState } from "react";

import { ScrollGatedTerms } from "@/components/scroll-gated-terms";
import { Button } from "@/components/ui/button";

export function SignUpSubmit() {
  const [hasRead, setHasRead] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <>
      <ScrollGatedTerms onRead={setHasRead} onAccept={setAccepted} />

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={!accepted}
          className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark"
        >
          Create my account
        </Button>
        {!accepted && (
          <p className="text-center text-xs text-muted-foreground">
            {hasRead
              ? "Tick the box above to accept the Terms & Conditions."
              : "Scroll to the end of the Terms & Conditions to continue."}
          </p>
        )}
      </div>
    </>
  );
}
