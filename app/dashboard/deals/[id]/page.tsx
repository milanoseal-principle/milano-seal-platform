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
    toast.success(successMsg);
    refresh();
  }

  async function postProtectedTransition(
    action: "schedule" | "execute",
    body: Record<string, unknown>,
    successMsg: string,
  ) {
    if (!deal) return false;
    const res = await fetch(`/api/deals/${deal.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.message ?? data.error ?? "Protected transition failed.");
      return false;
    }
    toast.success(successMsg);
    refresh();
    return true;
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
  const isComplimentaryAuthorized = deal.payment_disposition === "complimentary" && deal.comp_authorized === true && Number(deal.amount_due ?? 0) === 0;
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

  const isPaidAndCompleted =
    stage === "completed" && deal.payment_status === "paid";
  const isShippedOrCompleted =
    stage === "shipped" || stage === "completed";
  const isBalanceDue =
    isShippedOrCompleted && deal.payment_status !== "paid";
  const showDocRelease =
    stage === "shipped" || stage === "apostille";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <Link href="/dashboard/deals">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to matters
        </Button>
      </Link>

      <AnimatePresence>
        {isPaidAndCompleted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-4 py-3 rounded-sm border"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)",
              borderColor: "rgba(212, 175, 55, 0.2)",
              boxShadow: "0 0 12px rgba(212, 175, 55, 0.05)"
            }}
          >
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#D4AF37]">
                Paid &amp; Released
              </p>
              <p className="text-xs text-muted-foreground">
                This matter is Paid &amp; Released. All obligations fulfilled.
              </p>
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
              Payment has not been confirmed. Balance must be cleared.
            </p>
          </div>
        </div>
      )}

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
            <MatterRiskBadge
              factors={{
                country_id: deal.destination_country,
                authority_confidence: null,
                translation_required: deal.translation,
                payment_status: deal.payment_status,
                matter_status: deal.matter_status,
                days_since_update: deal.apostille_at ? Math.floor((Date.now() - new Date(deal.apostille_at).getTime()) / 86400000) : 0,
                missing_items_count: 0,
                is_high_value: deal.total_price > 1500,
              }}
            />
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
            {deal.document_type} → {deal.destination_country}
            {deal.origin_state && (
              <span>
                {" "}(Origin Authority:{" "}
                {(() => {
                  const labelLine = (deal.notes || "").split("\n").find((l: string) => l.startsWith("[routing] origin_authority_label="));
                  return labelLine ? labelLine.replace("[routing] origin_authority_label=", "") : deal.origin_state;
                })()})
              </span>
            )}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
              {!isPaymentRequirementSatisfied && (
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
                      disabled={!isPaymentRequirementSatisfied || stage !== "awaiting_payment"}
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

                          const scheduled = await postProtectedTransition(
                            "schedule",
                            {
                              scheduled_at: new Date(scheduledAt).toISOString(),
                              ...(actionNote ? { notes: actionNote } : {}),
                            },
                            "Scheduled",
                          );
                          if (!scheduled) return;
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
                    !isPaymentRequirementSatisfied ||
                    stage !== "scheduled"
                  }
                  data-testid="action-execute"
                  className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                  onClick={async () => {
                    await postProtectedTransition("execute", {}, "Execution started.");
                  }}
                >
                  <ShieldCheck className="w-4 h-4" /> Mark Executed
                </Button>

                <Button
                  variant="outline"
                  disabled={!isPaymentRequirementSatisfied || stage !== "in_execution"}
                  data-testid="action-apostille"
                  className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                  onClick={() => moveStage("apostille", "Sent to apostille.")}
                >
                  <Stamp className="w-4 h-4" /> Send to Apostille
                </Button>

                <Button
                  variant="outline"
                  disabled={
                    !isPaymentRequirementSatisfied ||
                    stage !== "apostille" ||
                    !!deal.tracking_number
                  }
                  data-testid="action-ship"
                  className="justify-start gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft disabled:opacity-40"
                  onClick={() => {
                    setShipResult(null);
                    setShipError(null);
                    setShipDialogOpen(true);
                  }}
                >
                  <Truck className="w-4 h-4" /> Ship
                </Button>

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
              <CardTitle className="font-serif text-xl">Operational Ledger</CardTitle>
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

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gold" /> Client Messages
              </CardTitle>
              <CardDescription>
                Portal thread with {deal.client_name}. Inbound = client sent.
                Outbound = sent to their portal + WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-col gap-2 overflow-y-auto mb-4 pr-1"
                style={{ maxHeight: 340, minHeight: 80 }}
              >
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No messages yet. Send the first one below.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isClient = m.direction === "inbound";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[75%] rounded-sm px-3 py-2 text-sm ${
                          isClient
                            ? "self-start bg-muted border border-border"
                            : "self-end bg-gold/10 border border-gold/30"
                        }`}
                      >
                        <span className="text-foreground font-light leading-relaxed break-all">
                          {m.content}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {isClient ? deal.client_name : "You (coordinator)"}
                          {" · "}
                          {new Date(m.created_at).toLocaleString()}
                          {m.channel !== "portal" && (
                            <span className="ml-1 opacity-60">
                              via {m.channel}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>
              <Separator className="mb-4" />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message to the client…"
                  value={msgDraft}
                  onChange={(e) => setMsgDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={2}
                  className="resize-none flex-1"
                  disabled={msgSending}
                />
                <Button
                  onClick={() => void sendMessage()}
                  disabled={msgSending || !msgDraft.trim()}
                  className="self-end"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {msgSending ? "Sending…" : "Send"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Message appears instantly in the client portal. A WhatsApp
                notification is also sent if they have a phone number on file.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:self-start">
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
            <CardHeader>
              <CardTitle className="font-serif text-xl">Pricing Summary</CardTitle>
              <CardDescription>{deal.lane} lane · canonical Matter pricing</CardDescription>
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
                <span>Matter value</span>
                <span className="text-gold">{formatCurrencyDetailed(Number(deal.original_total ?? deal.total_price))}</span>
              </div>
              {Number(deal.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-gold">
                  <span>Courtesy adjustment</span>
                  <span>-{formatCurrencyDetailed(Number(deal.discount_amount ?? 0))}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <SecurePaymentCard
            deal={{
              id: deal.id,
              deal_id: deal.deal_id ?? deal.id,
              lane: deal.lane,
              total_price: Number(deal.total_price ?? 0),
              original_total: deal.original_total ?? deal.amount_before_adjustment ?? deal.total_price,
              discount_code: deal.discount_code ?? null,
              discount_amount: deal.discount_amount ?? 0,
              final_total: deal.final_total ?? deal.total_price,
              invoice_retainer: deal.invoice_retainer,
              invoice_balance: deal.invoice_balance,
              amount_due: deal.amount_due,
              amount_paid: deal.amount_paid,
              payment_status: deal.payment_status,
              payment_link: deal.payment_link,
              payment_disposition: deal.payment_disposition,
              balance_payment_link: deal.balance_payment_link,
              balance_payment_status: deal.balance_payment_status,
              balance_paid_at: deal.balance_paid_at,
              balance_amount_received: deal.balance_amount_received,
            }}
            onRefresh={refresh}
          />

          <details className="group rounded-xl border border-[#C6A55A]/10 bg-black/10 p-4">
            <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition hover:text-gold">
              More payment actions
              <span className="ml-2 text-[10px] normal-case tracking-normal opacity-60">Founder / admin</span>
            </summary>
            <div className="mt-4">
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
            </div>
          </details>

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" /> Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.tracking_number ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Carrier</span>
                    <span>{deal.carrier ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                    <code className="flex-1 text-xs break-all">
                      {deal.tracking_number}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(deal.tracking_number!);
                        toast.success("Copied", { id: "clipboard" });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {deal.label_url && (
                    <a href={deal.label_url} target="_blank" rel="noreferrer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-border/60 hover:border-gold/60 hover:text-gold hover:bg-gold-soft"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Label
                      </Button>
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No label yet — use the{" "}
                  <span className="text-gold font-medium">Ship</span> button in
                  the timeline above.
                </p>
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
                <Row label="Custody Rail" value={deal.tracking_number} />
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

          <AnimatePresence>
            {showDocRelease && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-[#0c0c12] border border-[#D4AF37]/15 rounded-sm">
                  <CardHeader className="p-4 pb-3">
                    <div>
                      <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                        Document Release
                      </p>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#D4AF37]" /> Release
                        Confirmation
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Confirm that documents have been released to the recipient.
                      This records a custody ledger event.
                    </p>
                    {!releaseSuccess && (
                      <MilanoReleaseSeal
                        matterId={deal.id}
                        matterRef={deal.deal_id ?? deal.id.slice(0, 8).toUpperCase()}
                        onConfirm={() => void confirmDocRelease()}
                      />
                    )}
                    {releaseSuccess ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-sm border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                        <CheckCircle2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                        <span className="text-xs text-[#D4AF37]">
                          Release confirmed and recorded.
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 text-sm disabled:opacity-40"
                        disabled={releaseLoading}
                        onClick={() => void confirmDocRelease()}
                      >
                        {releaseLoading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4" /> Confirm Document
                            Release
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog
        open={shipDialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setShipResult(null);
            setShipError(null);
          }
          setShipDialogOpen(o);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Create Shipping Label
            </DialogTitle>
          </DialogHeader>

          {shipResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 p-3 rounded-md bg-paid border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Label created successfully
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier</span>
                  <span className="font-medium">{shipResult.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking</span>
                  <code className="text-xs">{shipResult.tracking_number}</code>
                </div>
                {shipResult.eta && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ETA</span>
                    <span>{shipResult.eta}</span>
                  </div>
                )}
              </div>
              <a
                href={shipResult.label_url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ExternalLink className="w-4 h-4" /> Download Label
                </Button>
              </a>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShipDialogOpen(false)}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  From
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Name"
                    value={shipFrom.name}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={shipFrom.phone}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Street address"
                    value={shipFrom.street1}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, street1: e.target.value }))
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Apt / Suite (optional)"
                    value={shipFrom.street2}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, street2: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="City"
                    value={shipFrom.city}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="State"
                    value={shipFrom.state}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, state: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="ZIP"
                    value={shipFrom.zip}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, zip: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Country"
                    value={shipFrom.country}
                    onChange={(e) =>
                      setShipFrom((f) => ({ ...f, country: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  To
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Recipient name"
                    value={shipTo.name}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={shipTo.phone}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Street address"
                    value={shipTo.street1}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, street1: e.target.value }))
                    }
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Apt / Suite (optional)"
                    value={shipTo.street2}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, street2: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="City"
                    value={shipTo.city}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, city: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="State"
                    value={shipTo.state}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, state: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="ZIP"
                    value={shipTo.zip}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, zip: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Country"
                    value={shipTo.country}
                    onChange={(e) =>
                      setShipTo((f) => ({ ...f, country: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Parcel (inches / lbs)
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Length
                    </label>
                    <Input
                      value={shipParcel.length}
                      onChange={(e) =>
                        setShipParcel((p) => ({ ...p, length: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Width
                    </label>
                    <Input
                      value={shipParcel.width}
                      onChange={(e) =>
                        setShipParcel((p) => ({ ...p, width: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Height
                    </label>
                    <Input
                      value={shipParcel.height}
                      onChange={(e) =>
                        setShipParcel((p) => ({ ...p, height: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Weight (lb)
                    </label>
                    <Input
                      value={shipParcel.weight}
                      onChange={(e) =>
                        setShipParcel((p) => ({ ...p, weight: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Options
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipOpts.urgent}
                      onChange={(e) =>
                        setShipOpts((o) => ({ ...o, urgent: e.target.checked }))
                      }
                      className="rounded"
                    />
                    Urgent routing
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipOpts.signature_required}
                      onChange={(e) =>
                        setShipOpts((o) => ({
                          ...o,
                          signature_required: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    Signature required
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={shipOpts.skip_address_validation}
                      onChange={(e) =>
                        setShipOpts((o) => ({
                          ...o,
                          skip_address_validation: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    Skip address validation
                    <span className="text-[11px] text-muted-foreground">
                      (use if Shippo rejects a valid address)
                    </span>
                  </label>
                </div>
                <Input
                  type="number"
                  placeholder="Declared value USD (optional)"
                  value={shipOpts.declared_value}
                  onChange={(e) =>
                    setShipOpts((o) => ({
                      ...o,
                      declared_value: e.target.value,
                    }))
                  }
                />
              </div>

              {shipError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-critical border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{shipError}</span>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShipDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void createShipLabel()}
                  disabled={
                    shipLoading ||
                    !shipFrom.street1 ||
                    !shipFrom.zip ||
                    !shipTo.name ||
                    !shipTo.street1 ||
                    !shipTo.zip
                  }
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {shipLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" /> Create Label
                    </>
                  )}
                </Button>
              </DialogFooter>
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
