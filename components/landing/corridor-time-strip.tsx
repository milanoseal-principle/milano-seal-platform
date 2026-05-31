"use client";

import { useState, useEffect } from "react";

const CORRIDORS = [
  { city: "Tampa",       tz: "America/New_York" },
  { city: "Rome",        tz: "Europe/Rome" },
  { city: "Athens",      tz: "Europe/Athens" },
  { city: "Madrid",      tz: "Europe/Madrid" },
  { city: "Dubai",       tz: "Asia/Dubai" },
  { city: "Mexico City", tz: "America/Mexico_City" },
  { city: "São Paulo",   tz: "America/Sao_Paulo" },
];

function fmt(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function CorridorTimeStrip() {
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    const tick = () => setTimes(CORRIDORS.map((c) => fmt(c.tz)));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (times.length === 0) return null;

  return (
    <div
      className="border-t border-[#D4AF37]/[0.06] bg-[#040404] overflow-x-auto scrollbar-none"
      aria-label="Global corridor clocks"
    >
      <div className="flex items-center gap-0 min-w-max mx-auto px-6 py-2.5 divide-x divide-[#1A1A1A]">
        <span className="font-mono text-[7px] tracking-[0.35em] uppercase text-[#2A2A2A] pr-5 flex-shrink-0">
          Global Corridor Clocks
        </span>
        {CORRIDORS.map((c, i) => (
          <div key={c.city} className="flex items-baseline gap-2 px-5 flex-shrink-0">
            <span className="font-mono text-[8px] tracking-[0.15em] text-[#555]">
              {c.city}
            </span>
            <span
              className="font-mono text-[10px] tracking-[0.1em]"
              style={{ color: i === 0 ? "rgba(198,165,90,0.70)" : "rgba(198,165,90,0.40)" }}
            >
              {times[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
