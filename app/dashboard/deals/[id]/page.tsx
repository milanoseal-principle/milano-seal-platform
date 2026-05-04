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
  payment_link: string;
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

  const [scheduledAt, setScheduledAt] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [carrier, setCarrier] = useState("FedEx International Priority");
  const [tracking, setTracking] = useState("");
  const [assigneeName, setAssigneeName] = useState("Nicholas");
  const [payAmt, setPayAmt] = useState("");
  const [payRef, setPayRef] = useState("");

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

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
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

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
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
            <CardContent className="space-y-4">
              {!isPaid && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-critical">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Payment must be cleared before execution actions become
                    active.
                  </span>
                </div>
              )}

              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                {TIMELINE.map((step) => {
                  const done = !!step.at;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="relative pb-6 last:pb-0">
                      <div
                        className={`absolute -left-[18px] top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          done
                            ? "bg-primary border-primary"
                            : "bg-background border-border"
                        }`}
                      >
                        {done && (
                          <CheckCircle2 className="w-3 h-3 text-background" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 ${
                            done ? "text-gold" : "text-muted-foreground"
                          }`}
                        />
                        <span className="font-medium text-foreground">
                          {step.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {done ? formatDateTime(step.at) : "Pending"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="bg-border" />

              <div className="grid sm:grid-cols-2 gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isPaid || stage !== "awaiting_payment"}
                      data-testid="action-schedule"
                    >
                      <CalendarClock className="w-4 h-4 mr-2" /> Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule execution</DialogTitle>
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
                          if (!scheduledAt) return;
                          await patchDeal(
                            {
                              scheduled_at: new Date(scheduledAt).toISOString(),
                              ...(actionNote ? { notes: actionNote } : {}),
                            },
                            "Scheduled."
                          );
                          await moveStage("scheduled", "Scheduled.");
                        }}
                        disabled={!scheduledAt}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  disabled={!isPaid || stage !== "scheduled"}
                  data-testid="action-execute"
                  onClick={() =>
                    moveStage("in_execution", "Execution started.")
                  }
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Mark Executed
                </Button>

                <Button
                  variant="outline"
                  disabled={!isPaid || stage !== "in_execution"}
                  data-testid="action-apostille"
                  onClick={() => moveStage("apostille", "Sent to apostille.")}
                >
                  <Stamp className="w-4 h-4 mr-2" /> Send to Apostille
                </Button>

                {/* Ship */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isPaid || stage !== "apostille"}
                      data-testid="action-ship"
                    >
                      <Truck className="w-4 h-4 mr-2" /> Ship
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ship documents</DialogTitle>
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
                            "Shipped."
                          );
                          await moveStage("shipped", "Shipped.");
                        }}
                        disabled={!tracking || !carrier}
                      >
                        Confirm shipment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  disabled={stage !== "shipped"}
                  className="sm:col-span-2"
                  data-testid="action-complete"
                  onClick={() => moveStage("completed", "Matter completed.")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
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
                  <a
                    href={deal.payment_link}
                    target="_blank"
                    rel="noreferrer"
                  >
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
                            "Payment confirmed."
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
