"use client";

import Link from "next/link";
import { Activity, FileText, CheckCircle, Package, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/format";

interface ActivityEvent {
  id: string;
  event_type: string;
  deal_id: string | null;
  document_type: string | null;
  destination_country: string | null;
  detail: string | null;
  created_at: string;
}

interface ActivityData {
  events: ActivityEvent[];
}

function eventIcon(type: string) {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("intake") || t.includes("new") || t.includes("creat"))
    return <FileText className="w-3.5 h-3.5 text-[#C6A55A]" />;
  if (t.includes("complet") || t.includes("deliver") || t.includes("closed"))
    return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (t.includes("ship") || t.includes("courier") || t.includes("dispatch"))
    return <Package className="w-3.5 h-3.5 text-sky-400" />;
  if (t.includes("payment") || t.includes("paid"))
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  return <Activity className="w-3.5 h-3.5 text-[#9A9A9A]" />;
}

function eventLabel(event: ActivityEvent): string {
  const type = event.event_type ?? "Event";
  const readable = type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const parts: string[] = [readable];
  if (event.document_type && event.destination_country) {
    parts.push(`${event.document_type} – ${event.destination_country}`);
  } else if (event.document_type) {
    parts.push(event.document_type);
  } else if (event.destination_country) {
    parts.push(event.destination_country);
  }
  return parts.join(" · ");
}

export function RecentActivityFeed() {
  const { data, isLoading } = useApi<ActivityData>("/api/dashboard/recent-activity");

  return (
    <div
      className="rounded-lg border border-white/[0.06] p-5 flex flex-col gap-4"
      style={{ background: "rgba(3,3,5,0.90)" }}
    >
      <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#C6A55A]/50">
        Recent Activity
      </p>

      <div className="flex flex-col gap-0">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-white/[0.03] animate-pulse mb-2" />
            ))
          : (data?.events ?? []).length === 0 ? (
              <p className="text-[12px] text-[#9A9A9A]/50 py-4 text-center">No recent activity.</p>
            ) : (
              (data?.events ?? []).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="mt-0.5 flex-shrink-0">{eventIcon(event.event_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#9A9A9A] leading-snug truncate">
                      {eventLabel(event)}
                    </p>
                    <p className="text-[10px] text-[#9A9A9A]/40 mt-0.5">
                      {timeAgo(event.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
      </div>

      <Link
        href="/dashboard/terminal"
        className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/50 hover:text-[#C6A55A] transition-colors mt-auto"
      >
        View all activity →
      </Link>
    </div>
  );
}
