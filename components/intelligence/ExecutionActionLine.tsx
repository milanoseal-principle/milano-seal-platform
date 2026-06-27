export default function ExecutionActionLine({
  text,
  audienceLabel,
  className,
}: {
  text: string;
  audienceLabel?: string;
  className?: string;
}) {
  if (!text) return null;

  return (
    <p className={`text-xs leading-relaxed text-white/70 break-words ${className ?? ""}`}>
      {audienceLabel ? (
        <span className="mr-1.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--ms-gold)]">
          {audienceLabel}
        </span>
      ) : null}
      {text}
    </p>
  );
}
