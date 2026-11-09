import Link from "next/link";
import {
  commercialHref,
  COMMERCIAL_CTA_LABELS,
  COMMERCIAL_CTA_DISCLOSURE,
  primaryServiceCta,
  type CommercialAction,
  type CommercialContext,
} from "@/lib/conversion/commercialCta";

// Governed, context-aware commercial CTA row for public service surfaces.
// Reuses the existing design tokens. The first action is primary (solid gold),
// the rest are secondary. Every destination is an existing governed surface
// (P1 Get Pricing, governed concierge, canonical intake, counsel). No internal
// price or discount code is ever rendered here.
export function CommercialCtaRow({
  context = {},
  actions = ["get_pricing", "speak"],
  labels,
  disclosure = true,
  className = "",
  ariaLabel = "Commercial next steps",
  serviceStart = true,
}: {
  context?: CommercialContext;
  actions?: CommercialAction[];
  labels?: Partial<Record<CommercialAction, string>>;
  disclosure?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Lead with the page's contextual service CTA (e.g. Start Online Notary). */
  serviceStart?: boolean;
}) {
  const base = actions.length ? actions : (["get_pricing"] as CommercialAction[]);
  const start = primaryServiceCta(context.serviceIntent);
  const leadsWithService = serviceStart && !base.includes(start.action);
  const resolved: CommercialAction[] = leadsWithService ? [start.action, ...base] : base;
  const contextualLabels: Partial<Record<CommercialAction, string>> = leadsWithService ? { [start.action]: start.label } : {};
  return (
    <section aria-label={ariaLabel} className={className} data-commercial-cta="">
      <div className="flex flex-wrap gap-3">
        {resolved.map((action, index) => {
          const label = labels?.[action] ?? contextualLabels[action] ?? COMMERCIAL_CTA_LABELS[action];
          const primary = index === 0;
          return (
            <Link
              key={action}
              href={commercialHref(action, context)}
              className={
                primary
                  ? "inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#C6A55A] px-5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D4B76A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
                  : "inline-flex min-h-12 items-center gap-2 rounded-lg border border-[#C6A55A]/35 px-5 text-sm font-medium text-[#C6A55A] transition-colors hover:border-[#C6A55A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
      {disclosure && (
        <p className="mt-4 max-w-2xl text-xs leading-5 text-white/40 [overflow-wrap:anywhere]">
          {COMMERCIAL_CTA_DISCLOSURE}
        </p>
      )}
    </section>
  );
}
