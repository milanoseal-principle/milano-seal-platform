"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrencyDetailed,
  formatDateTime,
  stageLabel,
  stageTone,
  timeAgo,
} from "@/lib/format";
import {
  ArrowLeft,
  CalendarClock,
  ShieldCheck,
  Stamp,
  Truck,
  CheckCircle2,
  Copy,
  ExternalLink,
  CircleDollarSign,
  UserPlus,
  AlertCircle,
} from "lucide-react";

interface MilanoDeal {
  id: string;
  deal_id: string;
  client_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  document_type: string;
  use_case: string | null;
  destination_country: string;
  origin_state: string;
  apostille_required: boolean;
  docs_count: number;
  lane: string;
  urgency: string;
  mobile: boolean;
  miles: number;
  signers: number;
  witnesses: number;
  witness_type: string | null;
  translation: boolean;
  multi_country: boolean;
  base_price: number;
  witness_total: number;
  total_price: number;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  payment_link: string;
  balance_payment_link: string | null;
  balance_payment_status: string | null;
  balance_paid_at: string | null;
  balance_amount_received: number | null;
  deal_status: string;
  payment_status: string;
  conversion_score: number;
  assignee: string | null;
  scheduled_at: string | null;
  executed_at: string | null;
  apostille_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  tracking_number: string | null;
}

interface ActivityRow {
  id: string;
  actor: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export default function DealDetail() {
  const params = useParams<{ id: string }>();
  const dealId = params?.id ?? "";

  const {
    data: deal,
    isLoading,
    refetch: refetchDeal,
  } = useApi<MilanoDeal>(dealId ? `/api/deals/${dealId}` : null);
  const { data: activityResp, refetch: refetchActivity } = useApi<{
    activity: ActivityRow[];
  }>(dealId ? `/api/deals/${dealId}/activity` : null);
  const activity = activityResp?.activity;

  const refresh = () => {
    void refetchDeal();
    void refetchActivity();
  };

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [carrier, setCarrier] = useState("FedEx International Priority");
  const [tracking, setTracking] = useState("");
  const [assigneeName, setAssigneeName] = useState("Nicholas");
  const [payAmt, setPayAmt] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payBalAmt, setPayBalAmt] = useState("");
  const [payBalRef, setPayBalRef] = useState("");

  async function moveStage(stage: string, successMsg: string) {
    if (!deal) return;
    const res = await fetch("/api/admin/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: deal.deal_id ?? deal.id, stage }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not advance.");
      return;
    }
    toast.success(successMsg);
    refresh();
  }

  async function patchDeal(body: Record<string, unknown>, successMsg: string) {
    if (!deal) return;
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Update failed.");
      return;
    }
    toast.success(successMsg);
    refresh();
  }

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-36 rounded-md" />

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-10 w-72 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-10 rounded" />
            <Skeleton className="h-10 w-32 rounded" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <Card className="bg-card border-gold">
            <CardHeader>
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-64 rounded mt-1" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
                <div className="space-y-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="relative flex items-start gap-4 pb-5 last:pb-0"
                    >
                      <Skeleton className="relative z-10 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full" />
                      <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-4 w-24 rounded" />
                        </div>
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-gold">
              <CardHeader>
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-4 w-28 rounded mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-gold">
              <CardHeader>
                <Skeleton className="h-6 w-24 rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded" />
                ))}
                <Skeleton className="h-9 w-full rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  if (!deal) return <div className="text-destructive">Matter not found.</div>;

  const isPaid = deal.payment_status === "paid";
  const stage = deal.deal_status;

  const TIMELINE: {
    key: string;
    label: string;
    icon: typeof Stamp;
    at: string | null | undefined;
  }[] = [
    {
      key: "scheduled",
      label: "Scheduled",
      icon: CalendarClock,
      at: deal.scheduled_at,
    },
    {
      key: "in_execution",
      label: "Executed",
      icon: ShieldCheck,
      at: deal.executed_at,
    },
    {
      key: "apostille",
      label: "Apostille",
      icon: Stamp,
      at: deal.apostille_at,
    },
    { key: "shipped", label: "Shipped", icon: Truck, at: deal.shipped_at },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle2,
      at: deal.completed_at,
    },
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/deals">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to matters
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-gold">
              {deal.deal_id ?? `${deal.id.slice(0, 8)}…`}
            </span>
            <Badge
              variant="outline"
              className={
                stageTone(stage) === "paid"
                  ? "bg-paid"
                  : stageTone(stage) === "critical"
                    ? "bg-critical"
                    : "bg-await"
              }
            >
              {stageLabel(stage)}
            </Badge>
            <Badge
              variant="outline"
              className={isPaid ? "bg-paid" : "bg-await"}
            >
              {deal.payment_status}
            </Badge>
            <Badge
              variant="outline"
              className="border-gold text-gold bg-gold-soft"
            >
              {deal.lane}
            </Badge>
          </div>
          <h1 className="font-serif text-4xl text-foreground mt-2">
            {deal.client_name}
            {deal.company_name && (
              <span className="text-muted-foreground text-2xl">
                {" · "}
                {deal.company_name}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {deal.document_type} → {deal.destination_country} (from{" "}
            {deal.origin_state})
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Total
          </div>
          <div className="font-serif text-4xl text-gold">
            {formatCurrencyDetailed(deal.total_price)}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                Execution Timeline
              </CardTitle>
              <CardDescription>
                Stages gated until payment is cleared.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!isPaid && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-critical border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">
                    Payment must be cleared before execution actions become
                    active.
                  </span>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
                <div className="space-y-0">
                  {TIMELINE.map((step) => {
                    const done = !!step.at;
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.key}
                        className="relative flex items-start gap-4 pb-5 last:pb-0"
                      >
                        <div
                          className={`relative z-10 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            done
                              ? "bg-primary border-primary"
                              : "bg-card border-muted-foreground/30"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="w-3 h-3 text-card" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`w-4 h-4 ${
                                done ? "text-gold" : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                done
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {done ? formatDateTime(step.at) : "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid sm:grid-cols-2 gap-2">
                <Dialog
                  open={scheduleDialogOpen}
                  onOpenChange={setScheduleDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isPaid || stage !== "awaiting_payment"}
                      data-testid="action-schedule"
                      className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                    >
                      <CalendarClock className="w-4 h-4" /> Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">
                        Schedule execution
                      </DialogTitle>
                    </DialogHeader>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    <Textarea
                      placeholder="Note (optional)"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          if (!scheduledAt || !deal) return;

                          const patchRes = await fetch(
                            `/api/deals/${deal.id}`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                scheduled_at: new Date(
                                  scheduledAt,
                                ).toISOString(),
                                ...(actionNote ? { notes: actionNote } : {}),
                              }),
                            },
                          );
                          if (!patchRes.ok) {
                            const d = await patchRes.json().catch(() => ({}));
                            toast.error(d.error ?? "Failed to save schedule.");
                            return;
                          }
                          await moveStage("scheduled", "Scheduled");
                          setScheduledAt("");
                          setActionNote("");
                          setScheduleDialogOpen(false);
                        }}
                        disabled={!scheduledAt}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  disabled={
                    !isPaid ||
                    (stage !== "scheduled" &&
                      !(stage === "awaiting_payment" && !!deal.scheduled_at))
                  }
                  data-testid="action-execute"
                  className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                  onClick={async () => {
                    if (stage === "awaiting_payment" && deal.scheduled_at) {
                      await moveStage("scheduled", "");
                    }
                    await moveStage("in_execution", "Execution started.");
                  }}
                >
                  <ShieldCheck className="w-4 h-4" /> Mark Executed
                </Button>

                <Button
                  variant="outline"
                  disabled={!isPaid || stage !== "in_execution"}
                  data-testid="action-apostille"
                  className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                  onClick={() => moveStage("apostille", "Sent to apostille.")}
                >
                  <Stamp className="w-4 h-4" /> Send to Apostille
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isPaid || stage !== "apostille"}
                      data-testid="action-ship"
                      className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                    >
                      <Truck className="w-4 h-4" /> Ship
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">
                        Ship documents
                      </DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                    />
                    <Input
                      placeholder="Tracking number"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                    />
                    <Textarea
                      placeholder="Note (optional)"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          if (!tracking || !carrier) return;
                          await patchDeal(
                            {
                              tracking_number: tracking,
                              carrier,
                              ...(actionNote ? { notes: actionNote } : {}),
                            },
                            "Shipped.",
                          );
                          await moveStage("shipped", "Shipped.");
                        }}
                        disabled={!tracking || !carrier}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Confirm shipment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  disabled={stage !== "shipped"}
                  className="sm:col-span-2 justify-center gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                  data-testid="action-complete"
                  onClick={() => moveStage("completed", "Matter completed.")}
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Completed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {!activity || activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="border-l-2 border-gold pl-3 pb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-foreground">{a.action}</span>
                      <span className="text-xs text-muted-foreground">
                        · {a.actor ?? "system"}
                      </span>
                    </div>
                    {a.detail && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.detail}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDateTime(a.created_at)} ({timeAgo(a.created_at)})
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Pricing</CardTitle>
              <CardDescription>{deal.lane} lane</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base</span>
                <span>{formatCurrencyDetailed(deal.base_price)}</span>
              </div>
              {Number(deal.witness_total) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Witnesses</span>
                  <span>{formatCurrencyDetailed(deal.witness_total)}</span>
                </div>
              )}
              <Separator className="bg-border" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-gold">
                  {formatCurrencyDetailed(deal.total_price)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-gold" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                <code className="flex-1 text-xs break-all">
                  {deal.payment_link}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (deal.payment_link) {
                      navigator.clipboard.writeText(deal.payment_link);
                      toast.success("Copied");
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {deal.payment_link && (
                  <a href={deal.payment_link} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
              {!isPaid && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Confirm Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm payment</DialogTitle>
                    </DialogHeader>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={payAmt}
                      onChange={(e) => setPayAmt(e.target.value)}
                    />
                    <Input
                      placeholder="Wise reference (optional)"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        onClick={() =>
                          patchDeal(
                            {
                              payment_status: "paid",
                              payment_amount_received: Number(payAmt),
                              ...(payRef ? { payment_reference: payRef } : {}),
                            },
                            "Payment confirmed.",
                          )
                        }
                        disabled={!payAmt}
                      >
                        Mark paid
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Balance payment section */}
              {(deal.balance_payment_link ||
                ["shipped", "completed"].includes(stage)) && (
                <>
                  <Separator className="bg-border" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        Balance (50%)
                      </span>
                      {deal.balance_payment_status && (
                        <Badge
                          variant="outline"
                          className={
                            deal.balance_payment_status === "paid"
                              ? "bg-paid"
                              : "bg-await"
                          }
                        >
                          {deal.balance_payment_status}
                        </Badge>
                      )}
                    </div>

                    {deal.balance_payment_link ? (
                      <>
                        <div className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                          <code className="flex-1 text-xs break-all">
                            {deal.balance_payment_link}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                deal.balance_payment_link!,
                              );
                              toast.success("Copied");
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <a
                            href={deal.balance_payment_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>

                        {deal.balance_paid_at ? (
                          <p className="text-xs text-muted-foreground">
                            Received
                            {deal.balance_amount_received
                              ? ` · $${deal.balance_amount_received.toLocaleString()}`
                              : ""}{" "}
                            ·{" "}
                            {new Date(
                              deal.balance_paid_at,
                            ).toLocaleDateString()}
                          </p>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft"
                              >
                                Confirm Balance Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Confirm balance payment
                                </DialogTitle>
                              </DialogHeader>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={`Amount (${deal.invoice_balance ?? ""})`}
                                value={payBalAmt}
                                onChange={(e) => setPayBalAmt(e.target.value)}
                              />
                              <Input
                                placeholder="Wise reference (optional)"
                                value={payBalRef}
                                onChange={(e) => setPayBalRef(e.target.value)}
                              />
                              <DialogFooter>
                                <Button
                                  onClick={() =>
                                    patchDeal(
                                      {
                                        balance_payment_status: "paid",
                                        balance_amount_received:
                                          Number(payBalAmt),
                                        ...(payBalRef
                                          ? {
                                              balance_payment_reference:
                                                payBalRef,
                                            }
                                          : {}),
                                      },
                                      "Balance confirmed.",
                                    )
                                  }
                                  disabled={!payBalAmt}
                                >
                                  Mark balance paid
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Balance invoice generated automatically when matter
                        ships.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Email" value={deal.email} />
              {deal.phone && <Row label="Phone" value={deal.phone} />}
              <Row label="Use case" value={deal.use_case ?? "—"} />
              <Row label="Documents" value={String(deal.docs_count)} />
              <Row label="Signers" value={String(deal.signers)} />
              <Row
                label="Witnesses"
                value={`${deal.witnesses}${
                  deal.witness_type ? ` · ${deal.witness_type}` : ""
                }`}
              />
              <Row
                label="Apostille"
                value={deal.apostille_required ? "Required" : "No"}
              />
              <Row label="Urgency" value={deal.urgency} />
              {deal.mobile && (
                <Row label="Mobile" value={`${deal.miles} miles`} />
              )}
              {deal.translation && <Row label="Translation" value="Yes" />}
              {deal.multi_country && <Row label="Multi-country" value="Yes" />}
              {deal.tracking_number && (
                <Row label="Tracking" value={deal.tracking_number} />
              )}
              <Row
                label="Conversion score"
                value={`${deal.conversion_score}/100`}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gold" /> Assignee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-foreground">
                {deal.assignee ?? "Unassigned"}
              </p>
              <div className="flex gap-2">
                <Input
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    patchDeal({ assignee: assigneeName }, "Assigned.")
                  }
                >
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
