export default function ExecutionRevenueLine({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  if (!text) return null;

  return (
    <p
      className={`text-[10px] leading-relaxed text-emerald-300/80 break-words ${className ?? ""}`}
    >
      <span className="mr-1.5 font-mono text-[9px] uppercase tracking-wide text-emerald-400">
        Revenue Opportunity
      </span>
      {text}
    </p>
  );
}
