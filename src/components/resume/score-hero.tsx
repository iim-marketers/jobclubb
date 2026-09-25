export function ScoreHero({
  score,
  keywordMatch,
  originalScore,
  targetRole,
  tailored,
  missing,
}: {
  score: number;
  keywordMatch: number;
  originalScore: number | null;
  targetRole: string;
  tailored: boolean;
  missing: number;
}) {
  const status =
    score >= 80 ? "Ready to send" : score >= 60 ? "Nearly there" : "Needs work";
  const tip =
    score >= 80
      ? "Recruiter software should read this cleanly. Check every detail before you apply."
      : missing > 0
        ? `Add the ${missing} missing keyword${missing === 1 ? "" : "s"} that apply to you and regenerate.`
        : "Fix the failed checks and regenerate.";

  return (
    <section
      aria-label="ATS score"
      className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-5 rounded-3xl bg-linear-to-br from-brand-surface to-brand-surface-strong p-6 text-white sm:p-7 print:hidden"
    >
      <ScoreRing value={score} ready={score >= 80} />
      <div className="min-w-56 flex-1">
        <p className="font-head text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
          ATS score
        </p>
        <p className="mt-1 font-head text-xl font-extrabold tracking-tight sm:text-2xl">
          {status}
        </p>
        <p className="mt-1 text-sm leading-6 text-white/75">{tip}</p>

        <div className="mt-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-white/75">
              Keyword match for {tailored ? "this job post" : targetRole}
            </span>
            <span className="flex-none font-head">
              {originalScore !== null && (
                <span className="text-white/60">{originalScore}% → </span>
              )}
              <span className="text-sm font-bold">{keywordMatch}%</span>
            </span>
          </div>
          <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/15">
            {originalScore !== null && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                style={{ width: `${originalScore}%` }}
              />
            )}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${keywordMatch}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreRing({ value, ready }: { value: number; ready: boolean }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 flex-none">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          className="stroke-white/15"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className={ready ? "stroke-brand-accent" : "stroke-white"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-head text-3xl font-extrabold tracking-tight">
          {value}
        </span>
        <span className="text-[10px] text-white/70">out of 100</span>
      </div>
    </div>
  );
}
