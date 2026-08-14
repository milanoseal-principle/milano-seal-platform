"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { motion, AnimatePresence } from "framer-motion";
import { TrustModeGuide } from "@/components/dashboard/TrustModeGuide";
import { CertificatePanel } from "@/components/dashboard/CertificatePanel";
import { ShippoCustodyPanel } from "@/components/dashboard/ShippoCustodyPanel";
import { MatterRiskBadge } from "@/components/dashboard/MatterRiskBadge";
import { MilanoReleaseSeal } from "@/components/orbit/MilanoReleaseSeal";
import { ComplimentaryMatterCard } from "@/components/payments/ComplimentaryMatterCard";
import { SecurePaymentCard } from "@/components/payments/SecurePaymentCard";
import {
  ArrowLeft,
  CalendarClock,
  ShieldCheck,
  Stamp,
  Truck,
  CheckCircle2,
  Copy,
  ExternalLink,
  UserPlus,
  AlertCircle,
  MessageSquare,
  Send,
  Package,
  FileCheck,
} from "lucide-react";

interface DealMessage {
  id: string;
  direction: "inbound" | "outbound";
  channel: string;
  content: string;
  status: string | null;
  created_at: string;
}

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
  original_total?: number | null;
  discount_code?: string | null;
  discount_amount?: number | null;
  final_total?: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  payment_link: string;
  balance_payment_link: string | null;
  balance_payment_status: string | null;
  balance_paid_at: string | null;
  balance_amount_received: number | null;
  deal_status: string;
  payment_status: string;
  payment_disposition?: string | null;
  amount_before_adjustment?: number | null;
  complimentary_adjustment_amount?: number | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  verified_revenue?: number | null;
  comp_authorized?: boolean | null;
  comp_authorized_by?: string | null;
  comp_authorized_at?: string | null;
  comp_reason_code?: string | null;
  comp_authorization_id?: string | null;
  conversion_score: number;
  assignee: string | null;
  scheduled_at: string | null;
  executed_at: string | null;
  apostille_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  label_url: string | null;
  courier_status: string | null;
  label_created_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  is_paid_and_released: boolean | null;
  matter_status: string | null;
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

  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [msgDraft, setMsgDraft] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dealId) return;

    void (async () => {
      try {
        const r = await fetch(`/api/deals/${dealId}/messages`, {
          cache: "no-store",
        });
        if (r.ok) {
          const body = (await r.json()) as { messages: DealMessage[] };
          setMessages(body.messages ?? []);
        }
      } catch {}
    })();

    const supabase = createClient();
    const channel = supabase
      .channel(`admin-messages-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as DealMessage;
            if (prev.find((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dealId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage() {
    if (!msgDraft.trim() || msgSending) return;
    setMsgSending(true);
    try {
      const r = await fetch(`/api/deals/${dealId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msgDraft.trim() }),
      });
      const body = (await r.json()) as {
        message?: DealMessage;
        error?: string;
      };
      if (!r.ok) {
        toast.error(body.error ?? "Failed to send");
      } else if (body.message) {
        setMessages((m) => [...m, body.message!]);
        setMsgDraft("");
        toast.success("Message sent to client portal");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setMsgSending(false);
    }
  }

  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [carrier, setCarrier] = useState("FedEx International Priority");
  const [tracking, setTracking] = useState("");
  const [assigneeName, setAssigneeName] = useState("Nicholas");
  const [protectedAction, setProtectedAction] = useState<"schedule" | "execute" | null>(null);

  interface ShipAddr {
    name: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  }
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipFrom, setShipFrom] = useState<ShipAddr>({
    name: "The Milano Seal",
    street1: "",
    street2: "",
    city: "Miami",
    state: "FL",
    zip: "",
    country: "US",
    phone: "",
  });
  const [shipTo, setShipTo] = useState<ShipAddr>({
    name: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
  });
  const [shipParcel, setShipParcel] = useState({
    length: "10",
    width: "8",
    height: "4",
    weight: "1",
    distance_unit: "in",
    mass_unit: "lb",
  });
  const [shipOpts, setShipOpts] = useState({
    urgent: false,
    signature_required: false,
    declared_value: "",
    skip_address_validation: false,
  });
  const [shipLoading, setShipLoading] = useState(false);
  const [shipResult, setShipResult] = useState<{
    tracking_number: string;
    carrier: string;
    label_url: string;
    eta?: string;
  } | null>(null);
  const [shipError, setShipError] = useState<string | null>(null);

  useEffect(() => {
    if (!deal) return;
    setShipTo((prev) => ({
      ...prev,
      name: prev.name || deal.client_name,
      phone: prev.phone || deal.phone || "",
    }));
    setShipOpts((prev) => ({ ...prev, urgent: deal.urgency === "urgent" }));
  }, [deal?.id]);

  async function createShipLabel() {
    if (!deal) return;
    setShipLoading(true);
    setShipError(null);
    try {
      const r = await fetch(`/api/shipping/create-label/${deal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: {
            name: shipFrom.name,
            street1: shipFrom.street1,
            ...(shipFrom.street2 ? { street2: shipFrom.street2 } : {}),
            city: shipFrom.city,
            state: shipFrom.state,
            zip: shipFrom.zip,
            country: shipFrom.country,
            ...(shipFrom.phone ? { phone: shipFrom.phone } : {}),
          },
          to: {
            name: shipTo.name,
            street1: shipTo.street1,
            ...(shipTo.street2 ? { street2: shipTo.street2 } : {}),
            city: shipTo.city,
            state: shipTo.state,
            zip: shipTo.zip,
            country: shipTo.country,
            ...(shipTo.phone ? { phone: shipTo.phone } : {}),
          },
          parcel: {
            length: Number(shipParcel.length),
            width: Number(shipParcel.width),
            height: Number(shipParcel.height),
            distance_unit: shipParcel.distance_unit,
            weight: Number(shipParcel.weight),
            mass_unit: shipParcel.mass_unit,
          },
          ...(shipOpts.urgent ? { urgent: true } : {}),
          ...(shipOpts.signature_required ? { signature_required: true } : {}),
          ...(shipOpts.declared_value
            ? { declared_value: Number(shipOpts.declared_value) }
            : {}),
          ...(shipOpts.skip_address_validation
            ? { skip_address_validation: true }
            : {}),
        }),
      });
      const body = (await r.json()) as {
        success?: boolean;
        tracking_number?: string;
        carrier?: string;
        label_url?: string;
        eta?: string;
        error?: string;
      };
      if (!r.ok || !body.success) {
        setShipError(body.error ?? "Label creation failed.");
        return;
      }
      setShipResult({
        tracking_number: body.tracking_number!,
        carrier: body.carrier!,
        label_url: body.label_url!,
        eta: body.eta,
      });
      toast.success(`Label created — ${body.carrier}`);
      refresh();
    } catch {
      setShipError("Network error. Please try again.");
    } finally {
      setShipLoading(false);
    }
  }

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
    if (successMsg) toast.success(successMsg);
    refresh();
  }

  async function postProtectedAction(
    path: "schedule" | "execute",
    body: Record<string, unknown>,
    successMsg: string,
  ) {
    if (!deal || protectedAction) return false;
    setProtectedAction(path);
    try {
      const res = await fetch(`/api/deals/${deal.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? data.error ?? "Action failed.");
        return false;
      }
      toast.success(successMsg);
      refresh();
      return true;
    } catch {
      toast.error("Network error.");
      return false;
    } finally {
      setProtectedAction(null);
    }
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
      </div>
    );
  if (!deal) return <div className="text-destructive">Matter not found.</div>;

  const isPaid = deal.payment_status === "paid";
  const isComplimentaryAuthorized =
    deal.payment_disposition === "complimentary" &&
    deal.comp_authorized === true &&
    Number(deal.amount_due ?? 0) === 0;
  const isPaymentRequirementSatisfied = isPaid || isComplimentaryAuthorized;
  const stage = deal.deal_status;

  async function confirmDocRelease() {
    if (!deal || releaseLoading) return;
    setReleaseLoading(true);
    try {
      const r = await fetch(`/api/deals/${deal.id}/release`, { method: "POST" });
      const body = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok) {
        toast.error(body.error ?? "Release confirmation failed.");
      } else {
        setReleaseSuccess(true);
        toast.success("Document release confirmed and recorded.");
        refresh();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setReleaseLoading(false);
    }
  }

  const TIMELINE = [
    { key: "scheduled", label: "Scheduled", icon: CalendarClock, at: deal.scheduled_at },
    { key: "in_execution", label: "Executed", icon: ShieldCheck, at: deal.executed_at },
    { key: "apostille", label: "Apostille", icon: Stamp, at: deal.apostille_at },
    { key: "shipped", label: "Shipped", icon: Truck, at: deal.shipped_at },
    { key: "completed", label: "Completed", icon: CheckCircle2, at: deal.completed_at },
  ];

  const isPaidAndCompleted = stage === "completed" && deal.payment_status === "paid";
  const isShippedOrCompleted = stage === "shipped" || stage === "completed";
  const isBalanceDue = isShippedOrCompleted && deal.payment_status !== "paid";
  const showDocRelease = stage === "shipped" || stage === "apostille";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      <Link href="/dashboard/deals">
        <Button variant="ghost" size="sm" className="text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to matters
        </Button>
      </Link>

      <AnimatePresence>
        {isPaidAndCompleted && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 px-4 py-3 rounded-sm border" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)", borderColor: "rgba(212, 175, 55, 0.2)", boxShadow: "0 0 12px rgba(212, 175, 55, 0.05)" }}>
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#D4AF37]">Paid &amp; Released</p>
              <p className="text-xs text-muted-foreground">This matter is Paid &amp; Released. All obligations fulfilled.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBalanceDue && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-amber-500/30 bg-amber-500/5">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Balance Due</p>
            <p className="text-xs text-muted-foreground">Payment has not been confirmed. Balance must be cleared.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-gold">{deal.deal_id ?? `${deal.id.slice(0, 8)}…`}</span>
            <Badge variant="outline" className={stageTone(stage) === "paid" ? "bg-paid" : stageTone(stage) === "critical" ? "bg-critical" : "bg-await"}>{stageLabel(stage)}</Badge>
            <Badge variant="outline" className={isPaid ? "bg-paid" : "bg-await"}>{deal.payment_status}</Badge>
            <Badge variant="outline" className="border-gold text-gold bg-gold-soft">{deal.lane}</Badge>
          </div>
          <h1 className="font-serif text-4xl text-foreground mt-2">{deal.client_name}</h1>
          <p className="text-muted-foreground">{deal.document_type} → {deal.destination_country}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="font-serif text-4xl text-gold">{formatCurrencyDetailed(deal.total_price)}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Execution Timeline</CardTitle>
              <CardDescription>Stages gated until payment is cleared.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!isPaymentRequirementSatisfied && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-critical border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">Payment must be cleared before execution actions become active.</span>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
                <div className="space-y-0">
                  {TIMELINE.map((step) => {
                    const done = !!step.at;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="relative flex items-start gap-4 pb-5 last:pb-0">
                        <div className={`relative z-10 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-primary border-primary" : "bg-card border-muted-foreground/30"}`}>
                          {done ? <CheckCircle2 className="w-3 h-3 text-card" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${done ? "text-gold" : "text-muted-foreground"}`} /><span className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span></div>
                          <p className="text-xs text-muted-foreground mt-0.5">{done ? formatDateTime(step.at) : "Pending"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="grid sm:grid-cols-2 gap-2">
                <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "awaiting_payment" || protectedAction !== null} data-testid="action-schedule" className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40">
                      <CalendarClock className="w-4 h-4" /> Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-serif">Schedule execution</DialogTitle></DialogHeader>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                    <Textarea placeholder="Note (optional)" value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                    <DialogFooter>
                      <Button onClick={async () => {
                        if (!scheduledAt || !deal) return;
                        const ok = await postProtectedAction("schedule", { execution_date: new Date(scheduledAt).toISOString(), ...(actionNote ? { note: actionNote } : {}) }, "Scheduled");
                        if (!ok) return;
                        setScheduledAt("");
                        setActionNote("");
                        setScheduleDialogOpen(false);
                      }} disabled={!scheduledAt || protectedAction !== null} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {protectedAction === "schedule" ? "Scheduling…" : "Confirm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "scheduled" || protectedAction !== null} data-testid="action-execute" className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40" onClick={() => void postProtectedAction("execute", {}, "Execution started.")}>
                  <ShieldCheck className="w-4 h-4" /> {protectedAction === "execute" ? "Starting…" : "Mark Executed"}
                </Button>

                <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "in_execution"} data-testid="action-apostille" className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40" onClick={() => moveStage("apostille", "Sent to apostille.")}>
                  <Stamp className="w-4 h-4" /> Send to Apostille
                </Button>

                <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "apostille" || !!deal.tracking_number} data-testid="action-ship" className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40" onClick={() => { setShipResult(null); setShipError(null); setShipDialogOpen(true); }}>
                  <Truck className="w-4 h-4" /> Ship
                </Button>

                <Button variant="outline" disabled={stage !== "shipped"} className="sm:col-span-2 justify-center gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40" data-testid="action-complete" onClick={() => moveStage("completed", "Matter completed.")}>
                  <CheckCircle2 className="w-4 h-4" /> Mark Completed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gold"><CardHeader><CardTitle className="font-serif text-xl">Operational Ledger</CardTitle></CardHeader><CardContent className="space-y-3 max-h-96 overflow-y-auto">{!activity || activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : activity.map((a) => <div key={a.id} className="border-l-2 border-gold pl-3 pb-3"><div className="flex items-center gap-2 text-sm"><span className="text-foreground">{a.action}</span><span className="text-xs text-muted-foreground">· {a.actor ?? "system"}</span></div>{a.detail && <p className="text-xs text-muted-foreground mt-1">{a.detail}</p>}<p className="text-[10px] text-muted-foreground/70 mt-1">{formatDateTime(a.created_at)} ({timeAgo(a.created_at)})</p></div>)}</CardContent></Card>

          <Card className="bg-card border-gold"><CardHeader><CardTitle className="font-serif text-xl flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gold" /> Client Messages</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-2 overflow-y-auto mb-4 pr-1" style={{ maxHeight: 340, minHeight: 80 }}>{messages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No messages yet. Send the first one below.</p> : messages.map((m) => <div key={m.id} className={`flex flex-col max-w-[75%] rounded-sm px-3 py-2 text-sm ${m.direction === "inbound" ? "self-start bg-muted border border-border" : "self-end bg-gold/10 border border-gold/30"}`}><span className="text-foreground font-light leading-relaxed break-all">{m.content}</span><span className="text-[10px] text-muted-foreground mt-1">{m.direction === "inbound" ? deal.client_name : "You (coordinator)"} · {new Date(m.created_at).toLocaleString()}</span></div>)}<div ref={threadEndRef} /></div><Separator className="mb-4" /><div className="flex gap-2"><Textarea placeholder="Type a message to the client…" value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} rows={2} className="resize-none flex-1" disabled={msgSending} /><Button onClick={() => void sendMessage()} disabled={msgSending || !msgDraft.trim()} className="self-end"><Send className="w-4 h-4 mr-1" />{msgSending ? "Sending…" : "Send"}</Button></div></CardContent></Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <TrustModeGuide destinationCountry={deal.destination_country ?? null} apostilleRequired={deal.apostille_required ?? false} translationRequired={deal.translation ?? false} signerCount={deal.signers ?? 0} originState={deal.origin_state ?? null} dealStatus={deal.deal_status ?? ""} paymentStatus={deal.payment_status ?? ""} />
          <ShippoCustodyPanel matterId={deal.id} carrier={deal.carrier ?? null} trackingNumber={deal.tracking_number ?? null} trackingUrl={undefined} courierStatus={deal.courier_status ?? null} labelCreatedAt={deal.label_created_at ?? null} deliveredAt={deal.delivered_at ?? null} />
          <CertificatePanel matterId={deal.id} isPaidAndReleased={deal.is_paid_and_released ?? false} documentCount={deal.docs_count ?? 1} destinationCountry={deal.destination_country ?? null} documentType={deal.document_type ?? null} />
          <SecurePaymentCard matterId={deal.id} paymentStatus={deal.payment_status} paymentLink={deal.payment_link} balancePaymentLink={deal.balance_payment_link} invoiceRetainer={deal.invoice_retainer} invoiceBalance={deal.invoice_balance} amountDue={deal.amount_due} onRefresh={refresh} />
          <ComplimentaryMatterCard matterId={deal.id} paymentDisposition={deal.payment_disposition ?? null} amountDue={deal.amount_due ?? null} authorized={deal.comp_authorized ?? false} authorizedBy={deal.comp_authorized_by ?? null} authorizedAt={deal.comp_authorized_at ?? null} reasonCode={deal.comp_reason_code ?? null} authorizationId={deal.comp_authorization_id ?? null} onRefresh={refresh} />
          {showDocRelease && <Card className="bg-card border-gold"><CardHeader><CardTitle className="font-serif text-xl">Document Release</CardTitle></CardHeader><CardContent><Button onClick={() => void confirmDocRelease()} disabled={releaseLoading || releaseSuccess} className="w-full">{releaseLoading ? "Recording…" : releaseSuccess ? "Release Recorded" : "Confirm Release"}</Button></CardContent></Card>}
          {isPaidAndCompleted && <MilanoReleaseSeal />}
        </div>
      </div>
    </motion.div>
  );
}
