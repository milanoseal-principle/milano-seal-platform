"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
          Touchpoints
        </p>
        <h1 className="font-serif text-4xl text-foreground">Follow-ups</h1>
      </div>

      <Card className="bg-card border-gold">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Open touchpoints</CardTitle>
          <CardDescription>
            Auto-scheduled at intake; resolve as you complete each touch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-ups.</p>
          ) : (
            data.map((f) => {
              const due = new Date(f.due_at).getTime();
              const overdue = due < Date.now() && f.status === "pending";
              return (
                <div
                  key={f.id}
                  className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    overdue
                      ? "border-destructive/40 bg-critical"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock
                      className={`w-4 h-4 shrink-0 ${
                        overdue ? "text-destructive" : "text-gold"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-gold-soft border-gold text-gold"
                        >
                          {f.type}
                        </Badge>
                        {f.deal_id && (
                          <Link href={`/dashboard/deals/${f.deal_id}`}>
                            <span className="font-mono text-xs text-gold hover:underline cursor-pointer">
                              {f.deal_id}
                            </span>
                          </Link>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            f.status === "completed"
                              ? "bg-paid"
                              : f.status === "cancelled"
                              ? "bg-critical"
                              : "bg-await"
                          }
                        >
                          {f.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        Due {formatDateTime(f.due_at)} · {timeAgo(f.due_at)}
                        {f.note ? ` · ${f.note}` : ""}
                      </div>
                    </div>
                  </div>
                  {f.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(f.id, "completed")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
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
        </CardContent>
      </Card>
    </div>
  );
}
