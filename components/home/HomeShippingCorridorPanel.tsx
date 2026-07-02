import type { HomeExecutionCorridor } from "@/lib/intelligence/homeCorridors";

interface Props {
  corridor: HomeExecutionCorridor;
}

function humanize(flag: string) {
  return flag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function HomeShippingCorridorPanel({ corridor }: Props) {
  // Compact custody timeline derived from the selected corridor.
  const steps = corridor.corridorSteps.slice(0, 5);

  const facts: Array<{ label: string; value: string }> = [
    { label: "Origin", value: corridor.origin },
    { label: "State Authority", value: corridor.stateAuthority },
    { label: "Authentication", value: corridor.authenticationPath },
    { label: "Courier Mode", value: corridor.courierMode },
    { label: "Release Trigger", value: corridor.releaseTrigger },
  ];

  return (
    <div className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#070709] p-5 sm:p-6">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/70">
        Custody Path
      </p>

      {/* Compact numbered timeline — horizontal on desktop, vertical on mobile */}
      <ol
        key={corridor.slug}
        className="animate-fade-in mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-1.5"
      >
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 sm:min-w-[140px]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--ms-gold)]/40 font-mono text-[9px] text-[var(--ms-gold)]">
              {index + 1}
            </span>
            <span className="text-[11px] leading-4 text-white/72">{step}</span>
          </li>
        ))}
      </ol>

      {/* Compact route facts — one row, two/three columns */}
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {facts.map((field) => (
          <div key={field.label} className="min-w-0">
            <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/55">
              {field.label}
            </dt>
            <dd className="mt-1 truncate text-[11px] text-white/68" title={field.value}>
              {field.value}
            </dd>
          </div>
        ))}
      </dl>

      {corridor.riskFlags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {corridor.riskFlags.slice(0, 4).map((flag) => (
            <span
              key={flag}
              className="rounded-full border border-[#C9794B]/35 bg-[#C9794B]/[0.08] px-2.5 py-0.5 text-[10px] text-[#E0A07A]"
            >
              {humanize(flag)}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-5 text-white/30">
        This preview shows the expected custody path before intake. Final routing
        is confirmed after document review, payment, execution, and apostille
        requirements are validated.
      </p>
    </div>
  );
}
