import { SectionEyebrow } from "@/components/page-shell";
import { RecruiterBoard } from "@/components/recruiter-board";
import { RECRUITER_LOGOS } from "@/lib/home-data";

export function EmployerShowcase() {
  return (
    <section className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto flex max-w-6xl gap-8 flex-col">
        <div>
          <SectionEyebrow>Where our members work</SectionEyebrow>
          <h2 className="mt-2 font-head text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hired by {Math.floor(RECRUITER_LOGOS.length / 10) * 10}+ top brands
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
            Luxury hotels, airlines and more. JobClubb puts you in front of the
            employers who are actively hiring today.
          </p>
        </div>

        <RecruiterBoard logos={RECRUITER_LOGOS} />
      </div>
    </section>
  );
}
