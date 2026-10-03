import { Suspense } from "react";

import { JobSearchBar, JobSearchBarFallback } from "@/components/job-search-bar";
import { SiteHeader } from "@/components/site-header";
import { getJobAccess } from "@/server/auth/current-candidate";

export default async function JobsLayout({ children }: LayoutProps<"/">) {
  const access = await getJobAccess();

  return (
    <>
      <SiteHeader
        search={
          <Suspense fallback={<JobSearchBarFallback />}>
            <JobSearchBar member={access.member} />
          </Suspense>
        }
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
