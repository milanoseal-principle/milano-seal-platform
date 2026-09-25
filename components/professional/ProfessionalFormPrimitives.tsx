"use client";

import type { ReactNode } from "react";

export const fieldClass =
  "min-h-11 w-full rounded-xl border border-white/[0.09] bg-black/30 px-3.5 text-[15px] text-white placeholder:text-white/25 focus:border-[#C6A65B]/45 focus:outline-none focus:ring-2 focus:ring-[#C6A65B]/20 disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-white/30">{hint}</p> : null}
    </div>
  );
}

export function FormNotice({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-red-400/25 bg-red-500/[0.06] text-red-200"
      : tone === "success"
        ? "border-[#C6A65B]/30 bg-[#C6A65B]/[0.06] text-[#F6F1E6]"
        : "border-white/[0.08] bg-white/[0.03] text-white/55";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${styles}`}>
      {children}
    </div>
  );
}

export const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-[#050507] transition-colors hover:bg-[#D4B76A] disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-6 text-sm font-medium text-white/65 transition-colors hover:border-[#C6A65B]/35 hover:text-[#C6A65B]";
