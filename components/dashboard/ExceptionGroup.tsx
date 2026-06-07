"use client";

import { useState } from "react";
<<<<<<< HEAD
import { ChevronDown, ChevronRight } from "lucide-react";

interface ExceptionGroupProps {
  title: string;
  count: number;
  severity: "critical" | "review" | "info";
  children: React.ReactNode;
}

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-red-950/60 border border-red-600/40 text-red-400",
    header: "text-red-400",
    dot: "bg-red-500",
  },
  review: {
    badge: "bg-amber-950/60 border border-amber-600/40 text-amber-400",
    header: "text-amber-400",
    dot: "bg-amber-500",
  },
  info: {
    badge: "bg-[rgba(198,165,90,0.12)] border border-[rgba(198,165,90,0.3)] text-[rgba(198,165,90,0.9)]",
    header: "text-[rgba(198,165,90,0.85)]",
    dot: "bg-[rgba(198,165,90,0.7)]",
  },
};

export function ExceptionGroup({ title, count, severity, children }: ExceptionGroupProps) {
  const [open, setOpen] = useState(count > 0);
  const s = SEVERITY_STYLES[severity];

  return (
    <div className="border border-[rgba(198,165,90,0.12)] rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0a0c] hover:bg-[#0d0d10] transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
          <span className={`font-mono text-xs uppercase tracking-widest ${s.header}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${s.badge}`}>
            {count}
          </span>
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 bg-[#060608] border-t border-[rgba(198,165,90,0.08)]">
          {children}
=======

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
>>>>>>> claude/funny-maxwell-hlxQN
        </div>
      )}
    </div>
  );
}
