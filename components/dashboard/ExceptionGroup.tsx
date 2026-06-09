"use client";

import { useState } from "react";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#ef4444",
  review:   "#f59e0b",
  medium:   "#f59e0b",
  low:      "#94a3b8",
};

interface Props {
  title?: string;
  category?: string;
  count: number;
  severity?: string;
  items?: { id: string; label: string; severity?: string }[];
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

export function ExceptionGroup({
  title,
  category,
  count,
  severity = "medium",
  items,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const label = title ?? category ?? "Exception";
  const dotColor = SEVERITY_COLOR[severity] ?? "#94a3b8";

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ cursor: "pointer", background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
            {label}
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
          {children ?? items?.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: SEVERITY_COLOR[item.severity ?? "low"] ?? "#94a3b8" }}
              />
              <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
