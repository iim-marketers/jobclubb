import Link from "next/link";

import { CAROUSEL, CAROUSEL_ITEM } from "@/components/home/shared";
import { SectionEyebrow } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { FRANCHISE_STEPS } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export function Franchise() {
  return (
    <section className="bg-card px-4 py-12 md:py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <SectionEyebrow>Partner with us</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Join our franchise program
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Become our partner and build a successful job placement &amp;
            recruitment business in your area - with a proven model, full
            training, and lifelong support.
          </p>
          <Button
            className="mt-6 bg-brand font-head text-brand-foreground hover:bg-brand-dark"
            nativeButton={false}
            render={<Link href="/franchise" />}
          >
            Become a partner
          </Button>
        </div>

        <ol className={cn(CAROUSEL, "mt-10 sm:grid-cols-2 lg:grid-cols-4")}>
          {FRANCHISE_STEPS.map((item) => (
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
