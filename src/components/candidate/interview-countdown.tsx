"use client";

import { useEffect, useState } from "react";

export function InterviewCountdown({
  startsAt,
  serverNow,
}: {
  startsAt: string;
  serverNow: number;
}) {
  // Seeded from the server's clock so the first client render matches the HTML.
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const ms = Math.max(new Date(startsAt).getTime() - now, 0);
  const units = [
    { label: "Days", value: Math.floor(ms / 86_400_000) },
    { label: "Hours", value: Math.floor(ms / 3_600_000) % 24 },
    { label: "Mins", value: Math.floor(ms / 60_000) % 60 },
  ];

  return (
    <div
      role="timer"
      aria-label={`Starts in ${units.map((u) => `${u.value} ${u.label.toLowerCase()}`).join(", ")}`}
      className="flex gap-2"
    >
      {units.map((u) => (
        <div
          key={u.label}
          className="flex w-16 flex-col items-center rounded-2xl bg-white/12 py-2.5 ring-1 ring-white/15 ring-inset sm:w-18"
        >
          <span className="font-head text-2xl font-extrabold tabular-nums sm:text-3xl">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-semibold tracking-wide text-white/65 uppercase">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
