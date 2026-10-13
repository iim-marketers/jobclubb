import { candidateOfferBadge, type CandidateOfferStatus } from "@/lib/placements";

export const NOT_SELECTED_BADGE =
  "bg-destructive/8 text-destructive ring-1 ring-destructive/30 ring-inset";

export const SELECTED_BADGE =
  "bg-good/12 text-good ring-1 ring-good/30 ring-inset";

const STAGE_BADGES = [
  "bg-brand/10 text-brand",
  "bg-brand/10 text-brand",
  "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  SELECTED_BADGE,
];

export function stageBadge(
  a: {
    stage: number;
    status: string;
    selected?: boolean;
    offer?: { status: CandidateOfferStatus } | null;
  },
  closed = false,
) {
  if (a.status === "rejected") return NOT_SELECTED_BADGE;
  if (closed) return "bg-muted text-muted-foreground";
  if (a.offer) return candidateOfferBadge(a.offer.status);
  return a.selected ? SELECTED_BADGE : STAGE_BADGES[a.stage];
}
