import { MemberHome } from "@/components/candidate/member-home";
import { CompanyHome } from "@/components/company/company-home";
import { About } from "@/components/home/about";
import { ClosingCta } from "@/components/home/closing-cta";
import { EmployerShowcase } from "@/components/home/employer-showcase";
import { FeaturedOpenings } from "@/components/home/featured-openings";
import { Franchise } from "@/components/home/franchise";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Membership } from "@/components/home/membership";
import { SiteJsonLd } from "@/components/json-ld";
import {
  getLapsedAccess,
  getMembershipView,
} from "@/server/auth/current-candidate";
import { getCurrentCompany } from "@/server/auth/current-company";
import { listJobs, varyTitles } from "@/server/jobs/listings";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const company = await getCurrentCompany();
  if (company) return <CompanyHome company={company} />;

  const [view, jobs] = await Promise.all([getMembershipView(), listJobs()]);
  if (
    view.kind === "member" ||
    (view.kind === "unpaid" && (await getLapsedAccess()))
  )
    return <MemberHome jobs={jobs} />;

  const teaser = varyTitles(jobs);
  return (
    <>
      <SiteJsonLd />
      <Hero jobs={teaser.slice(0, 3)} locked />
      <FeaturedOpenings jobs={teaser} locked />
      <EmployerShowcase />
      <HowItWorks />
      <Membership view={view} />
      <Franchise />
      <About />
      <ClosingCta view={view} />
    </>
  );
}
