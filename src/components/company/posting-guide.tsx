import { EyeOff, ListChecks, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: ListChecks,
    title: "Be specific",
    body: "Clear titles, pay ranges and requirements get more relevant applicants.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed before it goes live",
    body: "Our team checks each posting, and again after any edit.",
  },
  {
    icon: EyeOff,
    title: "Capability first",
    body: "You see applicants' skills and experience; names and contact details stay hidden until you unlock a profile.",
  },
];

export function PostingGuide() {
  return (
    <aside className="rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white">
      <p className="font-head text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
        How posting works
      </p>
      <ol className="mt-4 grid gap-5 md:grid-cols-3 md:gap-6">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-white/12">
              <Icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="font-head text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-sm leading-6 text-white/75">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
