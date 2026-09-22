"use client";

import { useCallback, useEffect, useState } from "react";

import { CandidateHeader } from "@/components/candidate/candidate-header";
import { CandidateSidebar, type CandidateProfile } from "@/components/candidate/candidate-sidebar";

export const SIDEBAR_COOKIE = "jc-sidebar";

export function CandidateShell({
  candidate,
  defaultCollapsed,
  children,
}: {
  candidate: CandidateProfile;
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      document.cookie = `${SIDEBAR_COOKIE}=${c ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !c;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      <CandidateSidebar candidate={candidate} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CandidateHeader candidate={candidate} sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
        {children}
      </div>
    </div>
  );
}
