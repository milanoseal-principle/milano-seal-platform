import { ChevronRight } from "lucide-react";
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
  const fields: Array<{ label: string; value: string }> = [
    { label: "Origin", value: corridor.origin },
    { label: "State Authority", value: corridor.stateAuthority },
    { label: "Authentication Path", value: corridor.authenticationPath },
    { label: "Courier Mode", value: corridor.courierMode },
    { label: "Custody Status", value: corridor.custodyStatus },
    { label: "Release Trigger", value: corridor.releaseTrigger },
  ];

  return (
    <div className="rounded-2xl border border-[#C6A55A]/20 bg-[#070709] p-5 sm:p-6">
      <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.24em] text-[#C6A55A]/70">
        Shipping &amp; Custody Corridor
      </p>

      <div className="mb-6 flex flex-col gap-2">
        {corridor.corridorSteps.map((step, index) => (
          <div key={step} className="flex flex-col gap-2">
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#C6A55A]/40 font-mono text-[9px] text-[#C6A55A]">
                {index + 1}
              </span>
              <span className="text-xs text-white/75">{step}</span>
            </div>
            {index < corridor.corridorSteps.length - 1 && (
              <div className="flex justify-center">
                <ChevronRight className="h-3.5 w-3.5 rotate-90 text-[#C6A55A]/50" />
              </div>
            )}
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="border-b border-white/[0.05] pb-2"
          >
            <dt className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C6A55A]/55">
              {field.label}
            </dt>
            <dd className="mt-1 text-xs text-white/70">{field.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.18em] text-[#C6A55A]/55">
          Risk Flags
        </p>
        <div className="flex flex-wrap gap-2">
          {corridor.riskFlags.map((flag) => (
            <span
              key={flag}
              className="rounded-full border border-[#C6A55A]/25 bg-[#C6A55A]/[0.05] px-2.5 py-1 text-[10px] text-white/60"
            >
              {humanize(flag)}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-5 text-[10px] leading-5 text-white/30">
        This preview shows the expected custody path before intake. Final routing
        is confirmed after document review, payment, execution, and apostille
        requirements are validated.
      </p>
      <p className="mt-2 text-[10px] leading-5 text-white/30">
        Estimated courier timing appears after label selection.
      </p>
    </div>
  );
}
