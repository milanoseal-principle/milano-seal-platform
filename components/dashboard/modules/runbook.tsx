"use client";

import Link from "next/link";
import { Landmark, MapPin, ShieldCheck } from "lucide-react";
import { ModuleWrapper } from "./_module-wrapper";

const SUMMARY = `Daily & weekly operator playbook`;
const DETAIL = `17 daily/weekly/monthly tasks. 3 critical rules: Never share bank numbers, Verify legal identifiers character-by-character, Italy QA before every apostille.`;

const SOURCE_PROTOCOLS = [
  {
    href: "/dashboard/field-visits",
    title: "Field Visit Control",
    description:
      "Residential signing-assignment protocol: preflight, visit evidence, no-response handling, authorized return visits, scanback, and originals custody.",
    icon: MapPin,
  },
  {
    href: "/dashboard/italy-records",
    title: "Italy Municipal Records Desk",
    description:
      "Authority-source municipal record request intelligence with document types, relationship evidence, fee conditions, and Comune verification gates.",
    icon: Landmark,
  },
] as const;

export function RunbookModule({ mod }: any) {
  return (
    <ModuleWrapper mod={mod}>
      <div className="mb-6 rounded-xl border border-[#C6A55A]/15 bg-[#111111] p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C6A55A]">
          Module Summary
        </p>
        <p className="text-sm leading-relaxed text-[#B0B0B0] whitespace-pre-line">
          {SUMMARY}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-[#C6A55A]/15 bg-[#0D0D0F] p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#C6A55A]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]">
            Source-Backed Protocols
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {SOURCE_PROTOCOLS.map((protocol) => {
            const Icon = protocol.icon;
            return (
              <Link
                key={protocol.href}
                href={protocol.href}
                className="group rounded-xl border border-[#C6A55A]/12 bg-black/20 p-4 transition-all hover:border-[#C6A55A]/35 hover:bg-[#C6A55A]/[0.035]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/5 text-[#C6A55A]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/85 transition-colors group-hover:text-white">
                      {protocol.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-[#8A8A8A]">
                      {protocol.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] leading-5 text-[#5F5F5F]">
          Source-backed protocol pages are internal operator references. Canonical Matter, payment, notarial, custody, and release controls remain authoritative.
        </p>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["Cadence", "Task", "Owner", "System", "Priority"].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap border-b border-[#2A2A2A] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#8A8A8A]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm italic text-[#8A8A8A]">
                  Legacy spreadsheet cadence data remains reference material. Governed operating actions belong in the canonical Matter and SOP systems.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#C6A55A]">
          Current Data
        </p>
        <p className="font-mono text-xs leading-relaxed text-[#8A8A8A] whitespace-pre-line">
          {DETAIL}
        </p>
      </div>
    </ModuleWrapper>
  );
}
