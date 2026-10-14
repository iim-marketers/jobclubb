"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { setJobSavedAction } from "@/app/(jobs)/jobs/[slug]/actions";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Back/forward navigation replays a stale `initialSaved`, so the last toggle wins.
const overrides = new Map<string, boolean>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setOverride(slug: string, saved: boolean) {
  overrides.set(slug, saved);
  for (const listener of listeners) listener();
}

export async function updateSavedJob(slug: string, saved: boolean) {
  setOverride(slug, saved);
  const { error } = await setJobSavedAction(slug, saved).catch(() => ({
    error: "Something went wrong. Please try again.",
  }));
  if (!error) return true;
  setOverride(slug, !saved);
  toast.error(error);
  return false;
}

function useSavedJob(slug: string, initialSaved: boolean) {
  const router = useRouter();
  const saved = useSyncExternalStore(
    subscribe,
    () => overrides.get(slug) ?? initialSaved,
    () => initialSaved,
  );
  const [pops, setPops] = useState(0);

  async function toggle() {
    const next = !saved;
    if (next) setPops((n) => n + 1);
    if ((await updateSavedJob(slug, next)) && next)
      toast.success("Job saved", {
        description: "Find it any time under Saved jobs.",
        action: {
          label: "View",
          onClick: () => router.push(`${CANDIDATE_HOME}/saved`),
        },
      });
  }

  return { saved, pops, toggle };
}

function HeartIcon({
  saved,
  pops,
  className,
}: {
  saved: boolean;
  pops: number;
  className?: string;
}) {
  const popping = saved && pops > 0;
  return (
    <span className="relative inline-flex">
      <Heart
        key={pops}
        className={cn(className, saved && "fill-current", popping && "jc-heart-pop")}
      />
      {popping && (
        <>
          <span key={`ring-${pops}`} aria-hidden className="jc-heart-ring" />
          <span key={`sparks-${pops}`} aria-hidden className="jc-heart-sparks" />
        </>
      )}
    </span>
  );
}

export function SaveJobHeart({
  slug,
  title,
  initialSaved,
  className,
}: {
  slug: string;
  title: string;
  initialSaved: boolean;
  className?: string;
}) {
  const { saved, pops, toggle } = useSavedJob(slug, initialSaved);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`Save ${title}`}
      title={saved ? "Saved" : "Save job"}
      onClick={toggle}
      className={cn(
        "relative z-10 flex size-9 flex-none items-center justify-center rounded-full transition-[color,background-color,scale] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90",
        saved
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-destructive/8 hover:text-destructive",
        className,
      )}
    >
      <HeartIcon saved={saved} pops={pops} className="size-4.5" />
    </button>
  );
}

export function SaveJobButton({
  slug,
  title,
  initialSaved,
  iconOnly = false,
  className,
}: {
  slug: string;
  title: string;
  initialSaved: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const { saved, pops, toggle } = useSavedJob(slug, initialSaved);
  const icon = (
    <span className={cn("inline-flex", saved && "text-destructive")}>
      <HeartIcon saved={saved} pops={pops} className="size-4" />
    </span>
  );

  if (iconOnly)
    return (
      <Button
        variant="outline"
        size="icon"
        aria-pressed={saved}
        aria-label={`Save ${title}`}
        onClick={toggle}
        className={className}
      >
        {icon}
      </Button>
    );

  return (
    <Button
      variant="outline"
      aria-pressed={saved}
      onClick={toggle}
      className={cn("font-head", className)}
    >
      {icon}
      {saved ? "Saved" : "Save job"}
    </Button>
  );
}
