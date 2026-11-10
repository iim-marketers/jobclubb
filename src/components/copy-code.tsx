"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        } catch {
          toast.error("Couldn't copy. Select the code and copy it instead.");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-sm font-semibold transition-colors hover:bg-muted"
      aria-label={`Copy code ${code}`}
    >
      {code}
      {copied ? <Check className="size-3.5 text-good" /> : <Copy className="size-3.5 text-muted-foreground" />}
    </button>
  );
}
