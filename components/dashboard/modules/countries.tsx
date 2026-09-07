"use client";

import Link from "next/link";
import { Landmark, ShieldCheck } from "lucide-react";
import { ModuleWrapper } from "./_module-wrapper";

const SUMMARY = `Country intelligence and authority-source routing`;
const DETAIL = `Legacy workbook demand scores are reference-only. Current execution decisions must use governed jurisdiction, authority-source, Matter, and manual-review truth.`;

export function CountriesModule({ mod }: any) {
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

      <Link
        href="/dashboard/italy-records"
        className="group mb-6 block rounded-xl border border-[#C6A55A]/18 bg-[#0D0D0F] p-5 transition-all hover:border-[#C6A55A]/40 hover:bg-[#C6A55A]/[0.035]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#C6A55A]/25 bg-[#C6A55A]/5 text-[#C6A55A]">
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-lg text-white/90 group-hover:text-white">
                Italy Municipal Records Desk
              </h2>
              <span className="rounded-full border border-emerald-300/10 bg-emerald-300/[0.035] px-2 py-1 text-[8px] font-mono uppercase tracking-[0.16em] text-emerald-200/65">
                Authority Source
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-[#8A8A8A]">
              Source-specific historical civil-status request intelligence derived from a Comune form. Includes record types, relationship-evidence requirements, administrative contribution conditions, delivery methods, and mandatory current-authority verification gates.
            </p>
          </div>
        </div>
      </Link>

      <div className="mb-6 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#111111]">
        <div className="border-b border-[#2A2A2A] px-5 py-4">
          <div className="flex items-center gap-2 text-[#C6A55A]">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Jurisdiction Data Rule
            </p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm leading-7 text-[#8A8A8A]">
            Do not treat workbook rows, old demand scores, or prototype jurisdiction tables as executable compliance truth. Current country and document routing must resolve through the governed intelligence/routing stack and fail to manual review when authority facts are incomplete or stale.
          </p>
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
