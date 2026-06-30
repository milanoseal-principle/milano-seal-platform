import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

// Calm, safe error state. Never leaks raw error internals to the surface — shows a
// controlled message and an optional retry/action. Use for failed data loads.

export function DashboardErrorState({
  title = "This view could not load.",
  description = "The data source did not respond. Try again, or check the source connection.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(194,85,78,0.25)] bg-[rgba(194,85,78,0.04)] px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(194,85,78,0.3)] text-[#E08A82]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="font-serif text-base text-foreground/85">{title}</p>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
