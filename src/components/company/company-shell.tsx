"use client";

import { useCallback, useEffect, useState } from "react";

import { SIDEBAR_COOKIE } from "@/components/candidate/candidate-shell";
import { CompanyHeader } from "@/components/company/company-header";
import {
  CompanySidebar,
  type CompanyProfile,
} from "@/components/company/company-sidebar";

export function CompanyShell({
  company,
  defaultCollapsed,
  children,
}: {
  company: CompanyProfile;
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
      if (
        e.key?.toLowerCase() === "b" &&
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      <CompanySidebar company={company} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CompanyHeader
          company={company}
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggle}
        />
        {children}
      </div>
    </div>
  );
}
