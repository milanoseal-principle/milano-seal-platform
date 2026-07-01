import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

// Canonical page header for every dashboard route: eyebrow, title, operational
// purpose sentence, optional status, and primary/secondary actions. Gives every
// module the same hierarchy so the dashboard reads as one command center.

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  status,
  primaryAction,
  secondaryAction,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  status?: ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/70">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{title}</h1>
          {status}
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {meta && <div className="mt-2">{meta}</div>}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
          {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
        </div>
      )}
    </header>
  );
}

function ActionButton({ action, variant }: { action: Action; variant: "primary" | "secondary" }) {
  const cls =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
      : "border border-gold/35 bg-black/30 text-gold/85 hover:border-gold/60 hover:text-gold";
  const inner = (
    <span
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${cls}`}
    >
      {action.label}
      <ArrowRight className="h-3.5 w-3.5" />
    </span>
  );
  if (action.href) return <Link href={action.href}>{inner}</Link>;
  return (
    <button type="button" onClick={action.onClick}>
      {inner}
    </button>
  );
}
