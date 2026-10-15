import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionEyebrow } from "@/components/page-shell";
import { ABOUT_STATS } from "@/lib/home-data";

export function About() {
  return (
    <section className="px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>About JobClubb</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find the one that&apos;s right for you
          </h2>

          <div className="mt-7 space-y-6">
            <div>
              <h3 className="font-head font-bold tracking-tight text-brand">
                Our Mission
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                To offer the right business solutions in the most ethical,
                high-quality and superior way - integrating cost-efficient
                people, better processes and new technologies to connect talent
                with opportunity.
              </p>
            </div>
            <div>
              <h3 className="font-head font-bold tracking-tight text-brand">
                Our Vision
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Where talent meets opportunity, we help job seekers find
                meaningful work and help businesses thrive.
              </p>
            </div>
          </div>

          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-2 py-1.5 font-head text-sm font-semibold text-brand hover:underline"
          >
            Read more about us
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 self-start">
          {ABOUT_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <p className="font-head text-2xl font-extrabold tracking-tight text-brand">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
