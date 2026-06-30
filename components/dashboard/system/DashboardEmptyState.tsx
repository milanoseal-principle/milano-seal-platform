import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

// Premium empty state — calm gold linework, honest copy. Used wherever a queue or
// table has no records (never a fake metric). Optional action to guide next step.

export function DashboardEmptyState({
  title = "No records requiring action.",
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold/20 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 text-gold/70">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="font-serif text-base text-foreground/85">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
