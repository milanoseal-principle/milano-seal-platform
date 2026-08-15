"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, X } from "lucide-react";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, timeAgo } from "@/lib/format";

interface FollowUp {
  id: string;
  deal_id: string | null;
  type: string;
  due_at: string;
  status: "pending" | "completed" | "cancelled";
  note: string | null;
}

export default function FollowUps() {
  const { data, isLoading, refetch } = useApi<FollowUp[]>("/api/follow-ups");
  const searchParams = useSearchParams();
  const focusDeal = searchParams.get("deal");

  const setStatus = async (
    id: string,
    status: "completed" | "cancelled",
  ) => {
    const res = await fetch(`/api/follow-ups/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Could not update follow-up.");
      return;
    }
    toast.success(`Marked ${status}.`);
    void refetch();
  };

  const rows = [...(data ?? [])].sort((a, b) => {
    const aFocus = focusDeal && a.deal_id === focusDeal ? 0 : 1;
    const bFocus = focusDeal && b.deal_id === focusDeal ? 0 : 1;
    if (aFocus !== bFocus) return aFocus - bFocus;
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return (
    <div className="space-y-6">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Follow-Up Queue"
          title="Follow-Up Queue"
          description="Live canonical payment follow-up cadence for stale unpaid Matters. Resolve each touchpoint as it is completed."
          primaryAction={{ label: "Prepare Follow-Up", href: "/dashboard/deals" }}
        />
      </Reveal>

      {focusDeal ? (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] px-4 py-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#D4AF37]/55">
              Focused Matter
            </p>
            <p className="mt-1 font-mono text-[10px] text-white/50">{focusDeal}</p>
          </div>
          <Link href="/dashboard/follow-ups" className="font-mono text-[9px] uppercase tracking-widest text-[#D4AF37]/75 hover:text-[#D4AF37]">
            Clear
          </Link>
        </div>
      ) : null}

      <div className="rounded-sm border border-gray-900 bg-[#0c0c12]">
        <div className="border-b border-gray-900 p-4">
          <h2 className="font-serif text-lg text-foreground">Open touchpoints</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Derived from Matter creation time and canonical 24h / 72h / 7d follow-up flags.
          </p>
        </div>

        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-3 rounded-sm border border-gray-900 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                    <div className="min-w-0 space-y-1.5">
                      <Skeleton className="h-5 w-40 rounded-sm" />
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No active follow-ups. All currently connected follow-up flags are current.
            </p>
          ) : (
            rows.map((followUp) => {
              const due = new Date(followUp.due_at).getTime();
              const overdue = due < Date.now() && followUp.status === "pending";
              const focused = Boolean(focusDeal && followUp.deal_id === focusDeal);

              return (
                <div
                  key={followUp.id}
                  className={`flex flex-col gap-3 rounded-sm border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    focused
                      ? "border-[#D4AF37]/45 bg-[#D4AF37]/[0.06]"
                      : overdue
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-gray-900 hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock className={`h-4 w-4 shrink-0 ${overdue ? "text-red-400" : "text-[#D4AF37]"}`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-sm border-[#D4AF37]/15 bg-[#D4AF37]/5 text-[10px] text-[#D4AF37]">
                          {followUp.type}
                        </Badge>
                        {followUp.deal_id ? (
                          <Link href={`/dashboard/deals/${encodeURIComponent(followUp.deal_id)}`}>
                            <span className="cursor-pointer font-mono text-xs text-[#D4AF37] hover:underline">
                              {followUp.deal_id}
                            </span>
                          </Link>
                        ) : null}
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-[10px] ${
                            followUp.status === "completed"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : followUp.status === "cancelled"
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {followUp.status}
                        </Badge>
                      </div>
                      <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        Due {formatDateTime(followUp.due_at)} · {timeAgo(followUp.due_at)}
                        {followUp.note ? ` · ${followUp.note}` : ""}
                      </div>
                    </div>
                  </div>

                  {followUp.status === "pending" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-800 text-xs hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                        onClick={() => setStatus(followUp.id, "completed")}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setStatus(followUp.id, "cancelled")}
                        aria-label="Cancel follow-up"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
