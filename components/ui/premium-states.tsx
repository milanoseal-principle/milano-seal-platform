import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type StateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function PremiumEmptyState({ title, description, action, className }: StateProps) {
  return (
    <section className={cn("ms-state-panel", className)} aria-labelledby="empty-state-title">
      <Inbox aria-hidden="true" className="size-5 text-[#D8C188]" />
      <div>
        <h2 id="empty-state-title" className="text-base font-medium text-[#F4F1EA]">{title}</h2>
        <p className="mt-1 max-w-prose text-sm leading-6 text-[#AAA59A]">{description}</p>
      </div>
      {action}
    </section>
  );
}

export function PremiumErrorState({ title, description, action, className }: StateProps) {
  return (
    <section className={cn("ms-state-panel ms-state-panel-error", className)} role="alert">
      <AlertCircle aria-hidden="true" className="size-5 text-red-300" />
      <div>
        <h2 className="text-base font-medium text-[#F4F1EA]">{title}</h2>
        <p className="mt-1 max-w-prose text-sm leading-6 text-[#AAA59A]">{description}</p>
      </div>
      {action}
    </section>
  );
}

export function PremiumSuccessState({ title, description, action, className }: StateProps) {
  return (
    <section className={cn("ms-state-panel ms-state-panel-success", className)} role="status" aria-live="polite">
      <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-300" />
      <div>
        <h2 className="text-base font-medium text-[#F4F1EA]">{title}</h2>
        <p className="mt-1 max-w-prose text-sm leading-6 text-[#AAA59A]">{description}</p>
      </div>
      {action}
    </section>
  );
}

