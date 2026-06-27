"use client";

import type { ExecutionAudience } from "@/data/execution-intelligence-matrix";

const LABELS: Record<ExecutionAudience, string> = {
  client: "Client",
  lawyer: "Lawyer",
  alliance_notary: "Notary",
  virtual_assistant: "VA",
  operator: "Operator",
  founder: "Founder",
};

export default function ExecutionAudienceTabs({
  audiences,
  value,
  onChange,
  className,
}: {
  audiences: ExecutionAudience[];
  value: ExecutionAudience;
  onChange: (a: ExecutionAudience) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {audiences.map((audience) => {
        const active = audience === value;
        return (
          <button
            key={audience}
            type="button"
            onClick={() => onChange(audience)}
            aria-pressed={active}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
              active
                ? "border-[var(--ms-gold)] bg-[var(--ms-gold)]/15 text-[var(--ms-gold)]"
                : "border-white/15 text-white/55 hover:text-white/80"
            }`}
          >
            {LABELS[audience]}
          </button>
        );
      })}
    </div>
  );
}
