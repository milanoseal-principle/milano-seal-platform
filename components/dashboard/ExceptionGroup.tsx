"use client";

import { useState } from "react";

interface ExceptionItem {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
}

interface Props {
  category: string;
  count: number;
  items: ExceptionItem[];
  defaultOpen?: boolean;
}

const SEVERITY_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#94a3b8",
};

export function ExceptionGroup({ category, count, items, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ cursor: "pointer", background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
            {category}
          </span>
          <span
            className="font-mono text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            {count}
          </span>
        </div>
        <span
          className="font-mono text-xs transition-transform duration-200"
          style={{ color: "rgba(212,175,55,0.5)", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: SEVERITY_COLOR[item.severity] ?? "#94a3b8" }}
              />
              <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
