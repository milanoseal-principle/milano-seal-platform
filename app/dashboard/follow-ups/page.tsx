"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, timeAgo } from "@/lib/format";
import { CheckCircle2, Clock, X } from "lucide-react";
import { toast } from "sonner";

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

  const setStatus = async (id: string, status: "completed" | "cancelled") => {
    const res = await fetch(`/api/follow-ups/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Could not update.");
      return;
    }
    toast.success(`Marked ${status}.`);
    void refetch();
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <DashboardPageHeader
          eyebrow="Follow-Up Queue"
          title="Follow-Up Queue"
          description="Operator queue for stale intakes, unpaid invoices, missing information, client and attorney replies, and overdue matter updates."
          primaryAction={{ label: "Prepare Follow-Up", href: "/dashboard/deals" }}
        />
      </Reveal>

      <div className="bg-[#0c0c12] border border-gray-900 rounded-sm">
        <div className="p-4 border-b border-gray-900">
          <h2 className="font-serif text-lg text-foreground">Open touchpoints</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-scheduled at intake — resolve as you complete each touch.
          </p>
        </div>

        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-sm border border-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Skeleton className="w-4 h-4 shrink-0 rounded-full" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20 rounded-sm" />
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-5 w-16 rounded-sm" />
                      </div>
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Skeleton className="h-8 w-20 rounded-sm" />
                    <Skeleton className="h-8 w-8 rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No active follow-ups. All matters are current.
            </p>
          ) : (
            data.map((f) => {
              const due = new Date(f.due_at).getTime();
              const overdue = due < Date.now() && f.status === "pending";
              return (
                <div
                  key={f.id}
                  className={`p-3 rounded-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                    overdue
                      ? "border-red-500/20 bg-red-500/5"
                      : "border-gray-900 hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock
                      className={`w-4 h-4 shrink-0 ${
                        overdue ? "text-red-400" : "text-[#D4AF37]"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="border-[#D4AF37]/15 text-[#D4AF37] bg-[#D4AF37]/5 rounded-sm text-[10px]"
                        >
                          {f.type}
                        </Badge>
                        {f.deal_id && (
                          <Link href={`/dashboard/deals/${f.deal_id}`}>
                            <span className="font-mono text-xs text-[#D4AF37] hover:underline cursor-pointer">
                              {f.deal_id}
                            </span>
                          </Link>
                        )}
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-[10px] ${
                            f.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : f.status === "cancelled"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {f.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate font-mono">
                        Due {formatDateTime(f.due_at)} &middot; {timeAgo(f.due_at)}
                        {f.note ? ` · ${f.note}` : ""}
                      </div>
                    </div>
                  </div>
                  {f.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-800 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] text-xs"
                        onClick={() => setStatus(f.id, "completed")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setStatus(f.id, "cancelled")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
