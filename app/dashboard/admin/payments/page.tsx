"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/format";
import {
  CreditCard,
  ExternalLink,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

interface WiseLive {
  id: string;
  status: string | null;
  short_url: string | null;
  amount: number | null;
  currency: string | null;
  description: string | null;
  payer_name: string | null;
  payer_email: string | null;
  created_at: string | null;
}

interface PaymentRow {
  deal_id: string;
  client_name: string | null;
  email: string | null;
  country: string | null;
  total_price: number | null;
  retainer: number | null;
  payment_method: string | null;
  db_payment_status: string | null;
  db_balance_status: string | null;
  payment_link: string | null;
  paid_amount: number | null;
  balance_paid_amount: number | null;
  balance_paid_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  deal_status: string | null;
  created_at: string;
  wise: WiseLive | null;
}

interface PaymentsResponse {
  ok: boolean;
  api_host: string;
  wise_ok: boolean;
  wise_error: string | null;
  wise_total: number;
  fetched_at: string;
  items: PaymentRow[];
}

const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  awaiting_payment: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  failed: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

function statusClass(s: string | null | undefined): string {
  if (!s) return "border-border text-muted-foreground";
  return STATUS_TONE[s.toLowerCase()] ?? "border-border text-foreground/80";
}

export default function AdminPaymentsPage() {
  const { data, isLoading, refetch } = useApi<PaymentsResponse>(
    "/api/admin/wise/payments",
  );
  const [filter, setFilter] = useState("");
  const [showOnly, setShowOnly] = useState<"all" | "paid" | "pending" | "failed">(
    "all",
  );

  const items = useMemo(() => {
    const list = data?.items ?? [];
    return list.filter((row) => {
      if (showOnly !== "all") {
        const s = (row.db_payment_status ?? "").toLowerCase();
        if (showOnly === "paid" && s !== "paid") return false;
        if (showOnly === "failed" && s !== "failed") return false;
        if (showOnly === "pending" && (s === "paid" || s === "failed"))
          return false;
      }
      if (!filter.trim()) return true;
      const needle = filter.toLowerCase();
      return [row.deal_id, row.client_name, row.email, row.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [data, filter, showOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
            Payment Review
          </p>
          <h1 className="font-serif text-4xl text-foreground">
            Wise Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.api_host} · {data?.wise_total ?? 0} live request
            {data?.wise_total === 1 ? "" : "s"} · last sync{" "}
            {data ? timeAgo(data.fetched_at) : "—"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {data?.wise_error && (
        <Card className="bg-rose-500/5 border-rose-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <TriangleAlert className="w-4 h-4 text-rose-400 mt-0.5" />
            <div>
              <p className="text-sm text-rose-300 font-medium">
                Could not reach Wise
              </p>
              <p className="text-xs text-rose-300/80 mt-1">{data.wise_error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by deal id, client, email, country…"
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-1">
          {(["all", "pending", "paid", "failed"] as const).map((opt) => (
            <Button
              key={opt}
              variant={showOnly === opt ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnly(opt)}
            >
              {opt[0].toUpperCase() + opt.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card className="bg-card border-gold">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gold" />
            Payment Requests
          </CardTitle>
          <CardDescription>
            DB row per deal joined to its live Wise production payment-request
            by reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No matching payments. Submit an intake at{" "}
              <Link href="/intake" className="text-gold underline">
                /intake
              </Link>{" "}
              to create one.
            </p>
          )}
          {items.map((row) => {
            const dbStatus = row.db_payment_status ?? "pending";
            const liveStatus = row.wise?.status ?? null;
            const drift =
              liveStatus && dbStatus.toLowerCase() !== liveStatus.toLowerCase();
            return (
              <div
                key={row.deal_id}
                className="rounded-lg border border-border bg-background/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/deals/${row.deal_id}`}>
                        <span className="font-mono text-xs text-gold hover:underline">
                          {row.deal_id}
                        </span>
                      </Link>
                      <span className="text-foreground font-medium">
                        {row.client_name ?? "—"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider ${statusClass(dbStatus)}`}
                      >
                        DB · {dbStatus}
                      </Badge>
                      {liveStatus && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${statusClass(liveStatus)}`}
                        >
                          Wise · {liveStatus}
                        </Badge>
                      )}
                      {drift && (
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-300 border-amber-500/30"
                        >
                          drift
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {row.country ?? "—"} · {row.email ?? "no email"} ·
                      created {formatDateTime(row.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-foreground font-medium">
                      {formatCurrency(row.total_price ?? 0)}
                    </div>
                    {row.retainer != null && (
                      <div className="text-xs text-muted-foreground">
                        Retainer {formatCurrency(row.retainer)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="rounded border border-border/60 p-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Database
                    </p>
                    <div className="space-y-0.5">
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="text-foreground">{dbStatus}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Balance:</span>{" "}
                        <span className="text-foreground">
                          {row.db_balance_status ?? "—"}
                        </span>
                      </div>
                      {row.paid_amount != null && (
                        <div>
                          <span className="text-muted-foreground">
                            Received:
                          </span>{" "}
                          <span className="text-foreground">
                            {formatCurrency(row.paid_amount)}
                          </span>
                        </div>
                      )}
                      {row.failure_reason && (
                        <div>
                          <span className="text-muted-foreground">
                            Failure:
                          </span>{" "}
                          <span className="text-rose-300">
                            {row.failure_reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-border/60 p-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Wise (live)
                    </p>
                    {row.wise ? (
                      <div className="space-y-0.5">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <span className="text-foreground">
                            {row.wise.status ?? "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>{" "}
                          <span className="text-foreground">
                            {row.wise.amount != null
                              ? `${row.wise.amount} ${row.wise.currency ?? ""}`
                              : "—"}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-muted-foreground">
                            Request id:
                          </span>{" "}
                          <span className="font-mono text-foreground">
                            {row.wise.id}
                          </span>
                        </div>
                        {row.wise.created_at && (
                          <div>
                            <span className="text-muted-foreground">
                              Issued:
                            </span>{" "}
                            <span className="text-foreground">
                              {formatDateTime(row.wise.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No matching Wise request. (Link below uses the fallback
                        pay URL.)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {row.payment_link && (
                    <a
                      href={row.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-gold/30 text-gold text-xs hover:bg-gold/10"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open pay link
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
