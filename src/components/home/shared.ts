import type { MembershipView } from "@/server/auth/current-candidate";

export type NonMemberView = Exclude<MembershipView, { kind: "member" }>;

export const CAROUSEL =
  "jc-hscroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:scroll-px-0 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0";
export const CAROUSEL_ITEM = "w-[82%] flex-none snap-start sm:w-auto";

// Non-members see only the role; the rest is placeholder text under a blur,
// so the real company, location and salary never reach the page.
export const HIDDEN = "blur-[5px] select-none";
