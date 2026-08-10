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
        <Skeleton className="h-40 w-full rounded-md" />
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
      const r = await fetch(`/api/deals/${deal.id}/release`, {
        method: "POST",
      });
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

  const TIMELINE: {
    key: string;
    label: string;
    icon: typeof Stamp;
    at: string | null | undefined;
  }[] = [
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <Link href="/dashboard/deals">
        <Button variant="ghost" size="sm" className="text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to matters
        </Button>
      </Link>

      <AnimatePresence>
        {isPaidAndCompleted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-sm border"
          >
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#D4AF37]">Paid &amp; Released</p>
              <p className="text-xs text-muted-foreground">All obligations fulfilled.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBalanceDue && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-amber-500/30 bg-amber-500/5">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Balance Due</p>
            <p className="text-xs text-muted-foreground">
              Wise settlement has not been confirmed. Balance remains locked until canonical reconciliation clears.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-gold">{deal.deal_id}</span>
            <Badge variant="outline" className="bg-await">{stageLabel(stage)}</Badge>
            <Badge variant="outline" className={isPaid ? "bg-paid" : "bg-await"}>
              {deal.payment_status}
            </Badge>
            <Badge variant="outline" className="border-gold text-gold bg-gold-soft">{deal.lane}</Badge>
            <MatterRiskBadge
              factors={{
                country_id: deal.destination_country,
                authority_confidence: null,
                translation_required: deal.translation,
                payment_status: deal.payment_status,
                matter_status: deal.matter_status,
                days_since_update: 0,
                missing_items_count: 0,
                is_high_value: deal.total_price > 1500,
              }}
            />
          </div>
          <h1 className="font-serif text-4xl text-foreground mt-2">{deal.client_name}</h1>
          <p className="text-muted-foreground">{deal.document_type} → {deal.destination_country}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="font-serif text-4xl text-gold">{formatCurrencyDetailed(deal.total_price)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Execution Timeline</CardTitle>
              <CardDescription>Stages remain gated until execution truth and Wise settlement are both cleared.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!isPaymentRequirementSatisfied && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-critical border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">Wise settlement must clear before execution actions become active.</span>
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
                        <div className="relative z-10 mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center">
                          {done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${done ? "text-gold" : "text-muted-foreground"}`} />
                            <span className="text-sm font-medium">{step.label}</span>
                          </div>
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
                    <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "awaiting_payment"} data-testid="action-schedule">
                      <CalendarClock className="w-4 h-4 mr-2" /> Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Schedule execution</DialogTitle></DialogHeader>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                    <Textarea placeholder="Note (optional)" value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          if (!scheduledAt || !deal) return;
                          const res = await fetch(`/api/deals/${deal.id}/schedule`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ execution_date: new Date(scheduledAt).toISOString() }),
                          });
                          const body = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            toast.error(body.message ?? body.error ?? "Scheduling failed.");
                            return;
                          }
                          setScheduleDialogOpen(false);
                          setScheduledAt("");
                          setActionNote("");
                          toast.success("Scheduled");
                          refresh();
                        }}
                        disabled={!scheduledAt}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "scheduled"} onClick={() => moveStage("in_execution", "Execution started.")}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Mark Executed
                </Button>
                <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "in_execution"} onClick={() => moveStage("apostille", "Sent to apostille.")}>
                  <Stamp className="w-4 h-4 mr-2" /> Send to Apostille
                </Button>
                <Button variant="outline" disabled={!isPaymentRequirementSatisfied || stage !== "apostille" || !!deal.tracking_number} onClick={() => setShipDialogOpen(true)}>
                  <Truck className="w-4 h-4 mr-2" /> Ship
                </Button>
                <Button variant="outline" disabled={stage !== "shipped"} onClick={() => moveStage("completed", "Matter completed.")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader><CardTitle className="font-serif text-xl">Operational Ledger</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {!activity || activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="border-l-2 border-gold pl-3 pb-3">
                    <div className="flex items-center gap-2 text-sm"><span>{a.action}</span><span className="text-xs text-muted-foreground">· {a.actor ?? "system"}</span></div>
                    {a.detail && <p className="text-xs text-muted-foreground mt-1">{a.detail}</p>}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{formatDateTime(a.created_at)} ({timeAgo(a.created_at)})</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader><CardTitle className="font-serif text-xl flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gold" /> Client Messages</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 overflow-y-auto mb-4 pr-1" style={{ maxHeight: 340, minHeight: 80 }}>
                {messages.map((m) => <div key={m.id} className="rounded-sm px-3 py-2 text-sm border">{m.content}</div>)}
                <div ref={threadEndRef} />
              </div>
              <div className="flex gap-2">
                <Textarea value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} rows={2} className="resize-none flex-1" />
                <Button onClick={() => void sendMessage()} disabled={msgSending || !msgDraft.trim()}><Send className="w-4 h-4 mr-1" />Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TrustModeGuide
            destinationCountry={deal.destination_country ?? null}
            apostilleRequired={deal.apostille_required ?? false}
            translationRequired={deal.translation ?? false}
            signerCount={deal.signers ?? 0}
            originState={deal.origin_state ?? null}
            dealStatus={deal.deal_status ?? ""}
            paymentStatus={deal.payment_status ?? ""}
          />

          <ShippoCustodyPanel
            matterId={deal.id}
            carrier={deal.carrier ?? null}
            trackingNumber={deal.tracking_number ?? null}
            trackingUrl={undefined}
            courierStatus={deal.courier_status ?? null}
            labelCreatedAt={deal.label_created_at ?? null}
            deliveredAt={deal.delivered_at ?? null}
          />

          <CertificatePanel
            matterId={deal.id}
            isPaidAndReleased={deal.is_paid_and_released ?? false}
            documentCount={deal.docs_count ?? 1}
            destinationCountry={deal.destination_country ?? null}
            documentType={deal.document_type ?? null}
            releasedAt={deal.completed_at ?? null}
          />

          <Card className="bg-card border-gold">
            <CardHeader><CardTitle className="font-serif text-xl">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span>Base</span><span>{formatCurrencyDetailed(deal.base_price)}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between font-medium"><span>Total</span><span className="text-gold">{formatCurrencyDetailed(deal.total_price)}</span></div>
            </CardContent>
          </Card>

          <ComplimentaryMatterCard
            matterId={deal.id}
            quoteId={deal.deal_id ?? deal.id}
            originalValue={Number(deal.amount_before_adjustment ?? deal.total_price ?? 0)}
            authorized={isComplimentaryAuthorized}
            authorizationId={deal.comp_authorization_id ?? null}
            auditEventId={deal.comp_authorization_id ?? null}
            authorizedBy={deal.comp_authorized_by ?? null}
            reasonLabel={deal.comp_reason_code ? deal.comp_reason_code.replace(/_/g, " ") : null}
            onChange={refresh}
          />

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-gold" /> Wise Payment
              </CardTitle>
              <CardDescription>Read-only settlement state. Wise reconciliation is authoritative.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={isPaid ? "bg-paid" : "bg-await"}>{deal.payment_status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount due</span>
                <span>{formatCurrencyDetailed(Number(deal.amount_due ?? deal.total_price ?? 0))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount paid</span>
                <span>{formatCurrencyDetailed(Number(deal.amount_paid ?? 0))}</span>
              </div>
              {deal.payment_link ? (
                <div className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                  <code className="flex-1 text-xs break-all">{deal.payment_link}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(deal.payment_link); toast.success("Copied", { id: "clipboard" }); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={deal.payment_link} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="w-4 h-4" /></Button></a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No Wise payment request is authorized yet.</p>
              )}
              {!isPaid && !isComplimentaryAuthorized && (
                <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  Awaiting canonical Wise reconciliation. Operators cannot manually mark this Matter paid.
                </div>
              )}

              {(deal.balance_payment_link || ["shipped", "completed"].includes(stage)) && (
                <>
                  <Separator className="bg-border" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Balance status</span>
                      <Badge variant="outline" className={deal.balance_payment_status === "paid" ? "bg-paid" : "bg-await"}>{deal.balance_payment_status ?? "pending"}</Badge>
                    </div>
                    {deal.balance_paid_at ? (
                      <p className="text-xs text-muted-foreground">Received via Wise reconciliation · {new Date(deal.balance_paid_at).toLocaleDateString()}</p>
                    ) : deal.balance_payment_link ? (
                      <div className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                        <code className="flex-1 text-xs break-all">{deal.balance_payment_link}</code>
                        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(deal.balance_payment_link!); toast.success("Copied", { id: "clipboard" }); }}><Copy className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Balance request has not been generated.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader><CardTitle className="font-serif text-xl">Facts</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Email" value={deal.email} />
              {deal.mobile && <Row label="Mobile" value={`${deal.miles} miles`} />}
              <Row label="Use case" value={deal.use_case ?? "—"} />
            </CardContent>
          </Card>

          <Card className="bg-card border-gold">
            <CardHeader><CardTitle className="font-serif text-xl flex items-center gap-2"><UserPlus className="w-4 h-4 text-gold" /> Assignee</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-foreground">{deal.assignee ?? "Unassigned"}</p>
              <div className="flex gap-2">
                <Input value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} />
                <Button variant="outline" onClick={() => patchDeal({ assignee: assigneeName }, "Assigned.")}>Assign</Button>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {showDocRelease && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-card border-gold">
                  <CardHeader><CardTitle className="font-serif text-xl flex items-center gap-2"><FileCheck className="w-4 h-4 text-gold" /> Release Confirmation</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {!releaseSuccess && <MilanoReleaseSeal matterId={deal.id} matterRef={deal.deal_id} onConfirm={() => void confirmDocRelease()} />}
                    {releaseSuccess ? <p className="text-sm text-gold">Release confirmed and recorded.</p> : <Button variant="outline" disabled={releaseLoading} onClick={() => void confirmDocRelease()}>Confirm Document Release</Button>}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Shipping Label</DialogTitle></DialogHeader>
          {shipResult ? (
            <p className="text-sm">Label created: {shipResult.tracking_number}</p>
          ) : (
            <div className="space-y-3">
              <Input placeholder="From street" value={shipFrom.street1} onChange={(e) => setShipFrom((f) => ({ ...f, street1: e.target.value }))} />
              <Input placeholder="To street" value={shipTo.street1} onChange={(e) => setShipTo((f) => ({ ...f, street1: e.target.value }))} />
              {shipError && <p className="text-sm text-destructive">{shipError}</p>}
              <DialogFooter><Button onClick={() => void createShipLabel()} disabled={shipLoading}>Create Label</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
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
