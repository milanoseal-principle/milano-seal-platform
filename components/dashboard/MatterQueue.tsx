"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import { stageLabel, stageTone, timeAgo } from "@/lib/format";
import Link from "next/link";
import { Briefcase } from "lucide-react";

interface MatterRow {
  id: string;
  client_name: string | null;
  deal_status: string;
  payment_status: string | null;
  destination_country: string | null;
  updated_at: string;
  created_at: string;
  due_at: string | null;
}

interface ApiResponse {
  matters: MatterRow[];
}

interface Props {
  onMatterClick?: (id: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function PaymentBadge({ status }: { status: string | null }) {
  if (status === "payment_confirmed" || status === "paid") {
    return (
      <span
        className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
        style={{ background: "rgba(34,197,94,0.08)", color: "rgba(34,197,94,0.8)", border: "1px solid rgba(34,197,94,0.2)" }}
      >
        Paid
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
        style={{ background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.8)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        Failed
      </span>
    );
  }
  return (
    <span
      className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
      style={{ background: "rgba(245,158,11,0.08)", color: "rgba(245,158,11,0.8)", border: "1px solid rgba(245,158,11,0.2)" }}
    >
      Pending
    </span>
  );
}

export function MatterQueue({ onMatterClick }: Props) {
  const { data, isLoading, isError } = useApi<ApiResponse>("/api/dashboard/matters");

  const matters = data?.matters ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-[9px] font-mono uppercase tracking-[0.28em]"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Matter Queue
        </p>
        <Link href="/dashboard/deals">
          <span
            className="text-[9px] font-mono uppercase tracking-wider cursor-pointer hover:underline"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            View all →
          </span>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-sm"
              style={{ background: "rgba(198,165,90,0.03)", border: "1px solid rgba(198,165,90,0.06)" }}
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm" style={{ color: "rgba(239,68,68,0.6)" }}>
          Failed to load matters.
        </p>
      )}

      {!isLoading && !isError && matters.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Briefcase className="w-5 h-5" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            No matters in queue.
          </p>
        </div>
      )}

      {!isLoading && !isError && matters.length > 0 && (
        <div className="space-y-1.5">
          {matters.map((m, idx) => {
            const days = daysSince(m.updated_at);
            const tone = stageTone(m.deal_status);
            const rowContent = (
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm cursor-pointer"
                style={{
                  background: "rgba(198,165,90,0.02)",
                  border: "1px solid rgba(198,165,90,0.08)",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(198,165,90,0.22)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(198,165,90,0.08)")
                }
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span
                    className="font-mono text-[10px] truncate"
                    style={{ color: "rgba(198,165,90,0.6)" }}
                  >
                    {m.id.slice(0, 8)}…
                  </span>
                  <span
                    className="text-sm truncate"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {m.client_name ?? "—"}
                  </span>
                  <span
                    className="text-[10px] truncate"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {m.destination_country ?? "—"}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      tone === "paid"
                        ? "bg-paid"
                        : tone === "critical"
                          ? "bg-critical"
                          : "bg-await"
                    }
                  >
                    {stageLabel(m.deal_status)}
                  </Badge>
                  <PaymentBadge status={m.payment_status} />
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-mono"
                      style={{
                        color:
                          days > 7
                            ? "rgba(239,68,68,0.6)"
                            : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {days === 0 ? "Today" : `${days}d ago`}
                    </span>
                    <Link
                      href={`/dashboard/deals/${m.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[9px] font-mono"
                      style={{ color: "rgba(198,165,90,0.4)" }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            );

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: EASE, delay: idx * 0.04 }}
                onClick={() => onMatterClick?.(m.id)}
              >
                {rowContent}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
