import type { ExecutionIntelligenceSignal } from "@/data/execution-intelligence-matrix";

type Severity = ExecutionIntelligenceSignal["severity"];

const SEVERITY_CLASS: Record<Severity, string> = {
  info: "border-[var(--ms-gold)]/40 text-[var(--ms-gold)]/90",
  watch: "border-amber-400/50 text-amber-300",
  escalate: "border-orange-500/60 text-orange-400",
  blocked: "border-red-500/60 text-red-400",
  revenue: "border-emerald-500/50 text-emerald-300",
};

export default function ExecutionSignalChips({
  signals,
  className,
}: {
  signals: ExecutionIntelligenceSignal[];
  className?: string;
}) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {signals.map((signal) => (
        <span
          key={signal.id}
          title={signal.value}
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium [overflow-wrap:anywhere] ${SEVERITY_CLASS[signal.severity]}`}
        >
          {signal.label}
        </span>
      ))}
    </div>
  );
}
