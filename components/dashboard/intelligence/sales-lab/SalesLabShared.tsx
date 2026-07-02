"use client";

import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react";

// Shared UI kit for the Sales Intelligence Lab (typed, accessible). Milano Seal
// dashboard look: black/gold/ivory.

export function GoldLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-px w-full ${className}`}
      style={{ background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.5), transparent)" }}
    />
  );
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "red" | "gray" }) {
  const tones = {
    gold: "text-[#C6A55A] border-[#C6A55A]/30 bg-[#C6A55A]/[0.08]",
    green: "text-[#7FBF9B] border-[#5B9D77]/30 bg-[#5B9D77]/[0.08]",
    red: "text-[#E08A82] border-[#C2554E]/30 bg-[#C2554E]/[0.08]",
    gray: "text-[#B0AA9E] border-white/10 bg-white/[0.03]",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function KPITile({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-[#1E1E1E] bg-[#111111] p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A8A8A]">{label}</p>
      <p className="mt-1.5 text-2xl font-light tabular-nums text-[#E8E4DC]">{value}</p>
      {detail && <p className="mt-1 text-[11px] text-[#8A8A8A]">{detail}</p>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-lg text-[#E8E4DC]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-[#8A8A8A]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-[#2A2A2A] bg-black/40 px-3 py-2 text-sm text-[#E8E4DC] placeholder:text-[#8A8A8A]/70 outline-none focus:border-[#C6A55A]/60 ${props.className ?? ""}`}
    />
  );
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-[#2A2A2A] bg-black/40 px-3 py-2 text-sm text-[#E8E4DC] outline-none focus:border-[#C6A55A]/60 ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function GoldBtn({ children, onClick, type = "button", disabled }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#C6A55A] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] transition-colors hover:bg-[#D4BB7A] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#2A2A2A] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#C6A55A] transition-colors hover:border-[#C6A55A]/60 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[#1E1E1E] bg-[#111111] p-5 ${className}`}>{children}</div>;
}

export function Notify({ message, tone = "gold" }: { message: string; tone?: "gold" | "green" | "red" }) {
  if (!message) return null;
  const tones = { gold: "border-[#C6A55A]/30 text-[#C6A55A]", green: "border-[#5B9D77]/30 text-[#7FBF9B]", red: "border-[#C2554E]/30 text-[#E08A82]" };
  return (
    <div className={`rounded-md border bg-black/40 px-3 py-2 text-[12px] ${tones[tone]}`} role="status">
      {message}
    </div>
  );
}
