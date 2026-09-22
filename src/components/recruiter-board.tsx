import Image from "next/image";

import { cn } from "@/lib/utils";

const ROW_COUNT = 3;
const ROW_DURATIONS = ["60s", "72s", "54s"];

export function RecruiterBoard({ logos }: { logos: string[] }) {
  const rows = Array.from({ length: ROW_COUNT }, (_, r) =>
    logos.filter((_, i) => i % ROW_COUNT === r),
  );

  return (
    <div className="jc-marquee-group -mx-4 flex flex-col gap-3 overflow-hidden py-1 mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:mx-0 sm:gap-4">
      {rows.map((row, r) => (
        <div
          key={r}
          className={cn(
            "jc-marquee flex w-max gap-3 sm:gap-4",
            r % 2 === 1 && "jc-marquee-reverse",
          )}
          style={{ animationDuration: ROW_DURATIONS[r] }}
        >
          {[...row, ...row].map((src, i) => (
            <div
              key={`${src}-${i}`}
              aria-hidden={i >= row.length || undefined}
              className="aspect-260/215 w-28 flex-none overflow-hidden rounded-xl border border-border bg-white shadow-xs transition-shadow hover:shadow-md sm:w-36"
            >
              <Image
                src={src}
                alt={i >= row.length ? "" : "Recruiter logo"}
                width={260}
                height={215}
                sizes="(min-width: 640px) 144px, 112px"
                className="size-full object-contain p-2 sm:p-2.5"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
