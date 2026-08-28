import type { ReactNode } from "react";
import { toneStyles, type DashboardTone } from "./dashboardTheme";

// Reusable dashboard panel. Gold top-hairline, consistent padding, optional action
// slot, subtle hover. Used as the standard container for every dashboard section.

export function CommandCard({
  title,
  eyebrow,
  description,
  action,
  tone = "gold",
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  tone?: DashboardTone;
  children?: ReactNode;
  className?: string;
}) {
  const t = toneStyles[tone];
  return (
    <section
      data-critical-card=""
      className={`relative overflow-visible rounded-2xl border p-5 transition-colors sm:p-6 ${className}`}
      style={{ background: "rgba(11,11,11,0.9)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${t.border}, transparent)` }}
      />
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: t.fg }}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className="font-serif text-lg text-foreground">{title}</h2>}
            {description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
