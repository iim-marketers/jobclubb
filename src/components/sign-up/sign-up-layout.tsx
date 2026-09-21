import Link from "next/link";
import { Building2, User } from "lucide-react";

const AUDIENCES = [
  { id: "candidate", label: "I'm looking for a job", short: "Candidate", href: "/sign-up", icon: User },
  { id: "company", label: "I'm hiring", short: "Company", href: "/sign-up/company", icon: Building2 },
] as const;

export type Audience = (typeof AUDIENCES)[number]["id"];

// Split screen: a brand panel that stays pinned under the site header while the
// form scrolls, then releases once both columns end together.
export function SignUpLayout({
  audience,
  eyebrow,
  title,
  description,
  panel,
  children,
}: {
  audience: Audience;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  panel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="jc-auth-panel relative isolate overflow-hidden text-white lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)]">
        <div className="jc-hscroll relative mx-auto flex h-full max-w-xl flex-col px-4 pt-8 pb-10 sm:px-8 lg:overflow-y-auto lg:px-10 lg:py-10 xl:px-14">
          <AudienceSwitch active={audience} />

          <p className="mt-8 font-head text-xs font-bold tracking-[0.14em] text-brand-accent uppercase lg:mt-12 [@media(max-height:56rem)]:lg:mt-8">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-head text-3xl leading-[1.1] font-extrabold tracking-tight sm:text-4xl xl:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-md leading-7 text-white/70">{description}</p>

          {panel && <div className="mt-10 hidden lg:block [@media(max-height:56rem)]:lg:mt-7">{panel}</div>}
        </div>
      </aside>

      <div className="min-w-0 px-4 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-20">
        <div className="mx-auto max-w-2xl">{children}</div>
      </div>
    </div>
  );
}

function AudienceSwitch({ active }: { active: Audience }) {
  return (
    <nav
      aria-label="Account type"
      className="grid grid-cols-2 gap-1 rounded-2xl bg-white/8 p-1 ring-1 ring-white/12 backdrop-blur-sm"
    >
      {AUDIENCES.map(({ id, label, short, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={id === active ? "page" : undefined}
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-head text-sm font-semibold text-white/70 transition-colors hover:text-white aria-[current=page]:bg-white aria-[current=page]:text-brand-surface-strong aria-[current=page]:shadow-sm"
        >
          <Icon className="size-4 flex-none" />
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

// Frosted card used for the live previews inside the brand panel.
export function PanelCard({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/12 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="font-head text-[11px] font-bold tracking-[0.14em] text-white/55 uppercase">
          {label}
        </p>
        {badge}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function PanelPoints({
  points,
}: {
  points: { icon: React.ComponentType<{ className?: string }>; text: string }[];
}) {
  return (
    <ul className="mt-8 space-y-3 [@media(max-height:56rem)]:hidden">
      {points.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3 text-sm text-white/70">
          <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-white/10">
            <Icon className="size-3.5 text-brand-accent" />
          </span>
          <span className="pt-1">{text}</span>
        </li>
      ))}
    </ul>
  );
}
