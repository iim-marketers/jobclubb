"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { setJobSavedAction } from "@/app/(jobs)/jobs/[slug]/actions";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Back/forward navigation replays the cached server payload, so the last
// toggle per job is kept here to stop a stale `initialSaved` from winning.
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

  async function toggle() {
    const next = !saved;
    if ((await updateSavedJob(slug, next)) && next)
      toast.success("Job saved", {
        description: "Find it any time under Saved jobs.",
        action: {
          label: "View",
          onClick: () => router.push(`${CANDIDATE_HOME}/saved`),
        },
      });
  }

  return { saved, toggle };
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
  const { saved, toggle } = useSavedJob(slug, initialSaved);

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
      <Heart className={cn("size-4.5", saved && "fill-current")} />
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
  const { saved, toggle } = useSavedJob(slug, initialSaved);
  const icon = (
    <Heart
      className={cn("size-4", saved && "fill-current text-destructive")}
    />
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
