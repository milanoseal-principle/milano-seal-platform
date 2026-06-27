import { ShieldCheck } from "lucide-react";

export default function ExecutionComplianceBoundary({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  return (
    <p
      className={`flex items-start gap-1.5 font-mono text-[9px] leading-relaxed text-[var(--ms-gold)]/55 break-words ${className ?? ""}`}
    >
      <ShieldCheck className="mt-[1px] h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="break-words">{text}</span>
    </p>
  );
}
