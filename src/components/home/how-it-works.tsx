import { CAROUSEL, CAROUSEL_ITEM } from "@/components/home/shared";
import { SectionEyebrow } from "@/components/page-shell";
import { HOW_IT_WORKS } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export function HowItWorks() {
  return (
    <section className="bg-card px-4 py-12 md:py-16  sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>For job seekers</SectionEyebrow>
        <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
          How JobClubb works
        </h2>

        <ol className={cn(CAROUSEL, "mt-10 sm:grid-cols-2 lg:grid-cols-3")}>
          {HOW_IT_WORKS.map((item) => (
            <li
              key={item.step}
              className={cn(
                CAROUSEL_ITEM,
                "rounded-2xl border border-border bg-background p-6",
              )}
            >
              <span className="font-head text-3xl font-extrabold text-brand/25">
                {item.step}
              </span>
              <h3 className="mt-3 font-head font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
