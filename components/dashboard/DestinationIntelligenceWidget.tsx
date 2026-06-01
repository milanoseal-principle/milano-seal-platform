"use client";

import { useApi } from "@/hooks/useApi";
import { Globe2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DestinationIntelligenceResponse, DestinationIntelligenceItem } from "@/lib/types/dashboard";

const FLAG_MAP: Record<string, string> = {
  italy: "🇮🇹",
  spain: "🇪🇸",
  brazil: "🇧🇷",
  mexico: "🇲🇽",
  france: "🇫🇷",
  germany: "🇩🇪",
  portugal: "🇵🇹",
  greece: "🇬🇷",
  uae: "🇦🇪",
};

function getFlag(slug: string): string {
  return FLAG_MAP[slug.toLowerCase()] ?? "🌐";
}

function DestRow({ dest }: { dest: DestinationIntelligenceItem }) {
  return (
    <div className="flex items-start justify-between px-4 py-3 border-b border-[#1A1A1A] last:border-0 hover:bg-[#0D0D0D] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg leading-none flex-shrink-0">{getFlag(dest.slug)}</span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#9A9A9A]">
            {dest.routeLabel}
          </p>
          <p className="font-mono text-[8.5px] tracking-wider text-[#4A4A4A] mt-0.5">
            {dest.protocol}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0 text-right ml-4">
        <div>
          <p className="font-mono text-[8.5px] tracking-widest uppercase text-[#4A4A4A]">Active</p>
          <p className="font-serif text-base text-[#C6A55A]">{dest.activeMatters}</p>
        </div>
        {dest.awaitingPayment > 0 && (
          <div>
            <p className="font-mono text-[8.5px] tracking-widest uppercase text-amber-600/60">Unpaid</p>
            <p className="font-serif text-base text-amber-500">{dest.awaitingPayment}</p>
          </div>
        )}
        {dest.apostillePending > 0 && (
          <div>
            <p className="font-mono text-[8.5px] tracking-widest uppercase text-sky-600/60">Apostille</p>
            <p className="font-serif text-base text-sky-400">{dest.apostillePending}</p>
          </div>
        )}
        {dest.completed > 0 && (
          <div>
            <p className="font-mono text-[8.5px] tracking-widest uppercase text-emerald-700/60">Done</p>
            <p className="font-serif text-base text-emerald-400">{dest.completed}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DestinationIntelligenceWidget() {
  const { data, isLoading, error } = useApi<DestinationIntelligenceResponse>(
    "/api/dashboard/destination-intelligence"
  );

  const activeDestinations =
    data?.destinations?.filter((d) => d.activeMatters > 0 || d.completed > 0) ?? [];

  return (
    <div className="bg-[#080808] border border-[#1A1A1A] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1A1A1A]">
        <Globe2 className="w-4 h-4 text-[#C6A55A]" />
        <div>
          <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#6A5520] mb-0.5">
            Corridor Intelligence
          </p>
          <h3 className="font-serif text-base text-white">Destination Intelligence</h3>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 bg-[#111]" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="px-6 py-10 text-center">
          <Globe2 className="w-7 h-7 text-[#2A2A2A] mx-auto mb-3" />
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#3A3A3A]">
            No active matters in this destination corridor.
          </p>
        </div>
      ) : activeDestinations.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Globe2 className="w-7 h-7 text-[#2A2A2A] mx-auto mb-3" />
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#3A3A3A]">
            No active matters in this destination corridor.
          </p>
          <p className="text-xs text-[#2A2A2A] mt-1">
            Matters will appear here once intake is logged.
          </p>
        </div>
      ) : (
        <div>
          {activeDestinations.map((dest) => (
            <DestRow key={dest.slug} dest={dest} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-[#1A1A1A]">
        <p className="font-mono text-[8.5px] tracking-[0.25em] uppercase text-[#3A3A3A]">
          Hague & Consular Corridors · Florida Origin
        </p>
      </div>
    </div>
  );
}
