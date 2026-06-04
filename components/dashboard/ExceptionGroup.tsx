"use client";

import { useState } from "react";
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
        </div>
      )}
    </div>
  );
}
