import { RefreshCw } from "lucide-react";

export function ReplacementTag({ replaces }: { replaces: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 font-head text-xs font-bold whitespace-nowrap text-brand">
      <RefreshCw className="size-3" />
      Replacement for {replaces}
    </span>
  );
}
