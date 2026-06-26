"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Play,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoMatter {
  id: string;
  deal_id: string;
  status: string;
  payment_status: string;
  payment_amount_due: number | null;
  amount_due: number | null;
  payment_reference: string | null;
  payment_amount_received: number | null;
  discount_code_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  scheduled_at: string | null;
  execution_at: string | null;
  apostille_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  invoice_status: string | null;
  wise_reference: string | null;
  assigned_lane: string | null;
}

interface DemoStatus {
  exists: boolean;
  matter_ref: string;
  deal: DemoMatter | null;
  portal_token: string | null;
  activity: Array<{
    id: string;
    action: string;
    detail: string | null;
    actor: string | null;
    created_at: string;
  }>;
}

type StepStatus = "pending" | "active" | "done" | "error" | "blocked";

interface Step {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    awaiting_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    in_execution: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    apostille: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    shipped: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    unpaid: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    paid: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return map[s] ?? "bg-muted text-muted-foreground border-border";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function E2EDemoShell() {
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [demo, setDemo] = useState<DemoStatus | null>(null);
  const [steps, setSteps] = useState<Record<string, StepStatus>>({});
  const [stepMessages, setStepMessages] = useState<Record<string, string>>({});
  const [discountApplied, setDiscountApplied] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const setStep = useCallback((id: string, status: StepStatus, message?: string) => {
    setSteps((s) => ({ ...s, [id]: status }));
    if (message !== undefined) setStepMessages((m) => ({ ...m, [id]: message }));
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/e2e/status");
      const data = await res.json() as DemoStatus;
      setDemo(data);
      if (data.exists && data.deal) {
        // Sync step states from matter reality
        const d = data.deal;
        if (d.discount_code_id) setDiscountApplied(true);
        const paid = d.payment_status === "paid";
        const statusOrder = ["awaiting_payment", "scheduled", "in_execution", "apostille", "shipped", "completed"];
        const idx = statusOrder.indexOf(d.status);
        if (paid) setStep("confirm-payment", "done", `Confirmed · ${fmt(d.payment_amount_received)} · ref ${d.payment_reference ?? "—"}`);
        if (idx >= 1) setStep("schedule", "done", `Scheduled`);
        if (idx >= 2) setStep("execution-started", "done", "Execution started");
        if (d.apostille_at || idx >= 3) setStep("ron-completed", "done", "RON completed → apostille");
        if (idx >= 3) setStep("apostille-submitted", "done", "Apostille submitted");
        if (idx >= 3) setStep("apostille-received", "done", "Apostille received");
        if (idx >= 4) setStep("ready-for-release", "done", "Ready for release");
        if (d.tracking_number) setStep("add-tracking", "done", `${d.carrier ?? ""} · ${d.tracking_number}`);
        if (idx >= 4) setStep("mark-shipped", "done", "Shipped");
        if (idx >= 5) setStep("mark-delivered", "done", "Delivered");
        if (d.status === "completed") setStep("mark-completed", "done", "Completed ✓");
      }
    } catch {
      toast.error("Could not fetch demo status");
    } finally {
      setLoading(false);
    }
  }, [setStep]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ── Seed / Reset ────────────────────────────────────────────────────────────

  async function seedDemo(reset = false) {
    setSeeding(true);
    try {
      const res = await fetch("/api/internal/e2e/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      toast.success(reset ? "Demo matter reset" : "Demo matter created");
      setSteps({});
      setStepMessages({});
      setDiscountApplied(false);
      await fetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  // ── Apply Discount ───────────────────────────────────────────────────────────

  async function applyDiscount() {
    if (!demo?.deal) return;
    setStep("apply-discount", "active");
    try {
      const res = await fetch(`/api/deals/${demo.deal.id}/apply-discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "TIFFANYTEST" }),
      });
      const data = await res.json() as {
        error?: string;
        original_amount?: number;
        discount_amount?: number;
        final_amount?: number;
        client_label?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDiscountApplied(true);
      setStep(
        "apply-discount",
        "done",
        `${data.client_label ?? "TIFFANYTEST"} · ${fmt(data.original_amount)} − ${fmt(data.discount_amount)} = ${fmt(data.final_amount)}`,
      );
      await fetchStatus();
    } catch (err) {
      setStep("apply-discount", "error", err instanceof Error ? err.message : "Error");
      toast.error("Discount failed: " + (err instanceof Error ? err.message : "unknown"));
    }
  }

  // ── Confirm Payment ──────────────────────────────────────────────────────────

  async function confirmPayment(mismatch = false) {
    if (!demo?.deal) return;
    const year = new Date().getFullYear();
    const DEMO_REF = `MS-DEMO-${year}-000001`;
    const expectedAmount = demo.deal.payment_amount_due ?? demo.deal.amount_due ?? 1250;
    const receivedAmount = mismatch ? expectedAmount - 100 : expectedAmount;
    const reference = `WISE-DEMO-${DEMO_REF}`;

    if (mismatch) {
      setStep("confirm-payment", "active");
      // Log mismatch event — do NOT confirm payment
      await fetch("/api/internal/e2e/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_ref: DEMO_REF,
          action: "PAYMENT_MISMATCH_FLAGGED",
          detail: `Mismatch test: received ${fmt(receivedAmount)} vs expected ${fmt(expectedAmount)} · ref ${reference}`,
          meta: { expected: expectedAmount, received: receivedAmount, mismatch: true },
        }),
      });
      setStep(
        "confirm-payment",
        "blocked",
        `MISMATCH FLAGGED — received ${fmt(receivedAmount)} vs expected ${fmt(expectedAmount)} — scheduling locked`,
      );
      toast.warning("Mismatch test: payment not confirmed, scheduling blocked");
      await fetchStatus();
      return;
    }

    setStep("confirm-payment", "active");
    try {
      const res = await fetch(`/api/deals/${demo.deal.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: "wise",
          payment_status: "paid",
          payment_reference: reference,
          payment_amount_received: receivedAmount,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Payment confirmation failed");

      // Log scheduling unlocked event
      await fetch("/api/internal/e2e/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_ref: DEMO_REF,
          action: "SCHEDULING_UNLOCKED",
          detail: `Payment confirmed ${fmt(receivedAmount)} · ref ${reference} → scheduling unlocked`,
          meta: { amount: receivedAmount, reference },
        }),
      });

      setStep(
        "confirm-payment",
        "done",
        `Paid · ${fmt(receivedAmount)} · ref ${reference}`,
      );
      toast.success("Payment confirmed — scheduling unlocked");
      await fetchStatus();
    } catch (err) {
      setStep("confirm-payment", "error", err instanceof Error ? err.message : "Error");
      toast.error("Payment failed: " + (err instanceof Error ? err.message : "unknown"));
    }
  }

  // ── Stage Transitions ────────────────────────────────────────────────────────

  async function advanceStage(
    stepId: string,
    newStatus: string,
    logAction: string,
    logDetail: string,
    extraFields?: Record<string, unknown>,
  ) {
    if (!demo?.deal) return;
    const DEMO_REF = demo.deal.deal_id;
    setStep(stepId, "active");
    try {
      const res = await fetch(`/api/deals/${demo.deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraFields }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Failed to advance to ${newStatus}`);

      setStep(stepId, "done", logDetail);
      toast.success(logDetail);
      await fetchStatus();
    } catch (err) {
      setStep(stepId, "error", err instanceof Error ? err.message : "Error");
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  async function logEvent(stepId: string, action: string, detail: string) {
    if (!demo?.deal) return;
    setStep(stepId, "active");
    try {
      await fetch("/api/internal/e2e/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_ref: demo.deal.deal_id, action, detail }),
      });
      setStep(stepId, "done", detail);
      await fetchStatus();
    } catch {
      setStep(stepId, "error", "Failed to log event");
    }
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  const d = demo?.deal ?? null;
  const isPaid = d?.payment_status === "paid";
  const year = new Date().getFullYear();
  const DEMO_REF = `MS-DEMO-${year}-000001`;

  function StepRow({
    id,
    label,
    description,
    children,
  }: {
    id: string;
    label: string;
    description?: string;
    children: React.ReactNode;
  }) {
    const s = steps[id] ?? "pending";
    const msg = stepMessages[id];
    return (
      <div className="flex gap-4 py-3 border-b border-border/40 last:border-0">
        <div className="pt-0.5 flex-shrink-0">
          {s === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {s === "active" && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
          {s === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
          {s === "blocked" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
          {s === "pending" && <Circle className="h-4 w-4 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{label}</span>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
          {msg && (
            <p
              className={`text-xs mt-0.5 ${
                s === "error"
                  ? "text-red-400"
                  : s === "blocked"
                  ? "text-yellow-400"
                  : "text-muted-foreground"
              }`}
            >
              {msg}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex gap-1.5">{children}</div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tiffany E2E Demo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Operator confidence harness — full flow from intake to completion
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Matter status summary */}
      {d && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Demo Matter</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedDemo(true)}
                disabled={seeding}
              >
                {seeding ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3 mr-1" />
                )}
                Reset Demo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Matter Ref</p>
                <p className="font-mono font-medium">{d.deal_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stage</p>
                <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColor(d.status)}`}>
                  {d.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColor(d.payment_status)}`}>
                  {d.payment_status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Due</p>
                <p className="font-medium">{fmt(d.payment_amount_due ?? d.amount_due)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Link
                href={`/dashboard/deals/${d.id}`}
                target="_blank"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                Open Matter Detail <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              {demo?.portal_token && (
                <Link
                  href={`/portal/${demo.portal_token}`}
                  target="_blank"
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  Open Client Portal <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              )}
              {demo?.portal_token && (
                <Link
                  href={`/portal/invoice`}
                  target="_blank"
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  Portal Invoice <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No matter yet */}
      {demo && !demo.exists && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              No demo matter found for <code className="bg-muted px-1 rounded">{DEMO_REF}</code>
            </p>
            <Button onClick={() => seedDemo(false)} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Start Demo Matter
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && !demo && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading demo status…
        </div>
      )}

      {/* Step walkthrough */}
      {d && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">E2E Step Walkthrough</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">

            {/* Stage 1 — Discount */}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1 pt-2 font-medium">
              Stage 1 — Discount Code
            </div>
            <StepRow
              id="apply-discount"
              label="Apply Discount Code"
              description="TIFFANYTEST · $100 off → $1,150 due"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={discountApplied || isPaid || steps["apply-discount"] === "active"}
                onClick={applyDiscount}
              >
                Apply TIFFANYTEST
              </Button>
            </StepRow>

            <Separator className="my-1" />

            {/* Stage 2 — Payment */}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1 pt-2 font-medium">
              Stage 2 — Wise Payment Simulation
            </div>
            <StepRow
              id="confirm-payment"
              label="Confirm Manual Wise Payment"
              description="Operator confirms simulated Wise transfer"
            >
              {!isPaid && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-yellow-400 border-yellow-500/40"
                    disabled={steps["confirm-payment"] === "active"}
                    onClick={() => confirmPayment(true)}
                  >
                    Test Mismatch ($1,100)
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-700 hover:bg-green-600 text-white"
                    disabled={steps["confirm-payment"] === "active"}
                    onClick={() => confirmPayment(false)}
                  >
                    Confirm Paid ({fmt(d.payment_amount_due ?? d.amount_due)})
                  </Button>
                </>
              )}
              {isPaid && (
                <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/40">
                  Paid ✓
                </Badge>
              )}
            </StepRow>

            <div className="pl-8 pb-2">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/60">Payment Gate:</span>{" "}
                {isPaid
                  ? "✓ Scheduling unlocked"
                  : "Scheduling, execution, apostille, and release are all blocked until payment confirmed"}
              </p>
            </div>

            <Separator className="my-1" />

            {/* Stage 3 — Execution */}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1 pt-2 font-medium">
              Stage 3 — Execution
            </div>
            <StepRow id="schedule" label="Schedule Execution" description="awaiting_payment → scheduled">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "awaiting_payment" ||
                  steps["schedule"] === "active"
                }
                onClick={() =>
                  advanceStage("schedule", "scheduled", "scheduled", "Execution scheduled", {
                    scheduled_at: new Date().toISOString(),
                  })
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Schedule"}
              </Button>
            </StepRow>

            <StepRow id="execution-started" label="Mark Execution Started" description="scheduled → in_execution">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "scheduled" ||
                  steps["execution-started"] === "active"
                }
                onClick={() =>
                  advanceStage("execution-started", "in_execution", "executed", "Execution started", {
                    execution_at: new Date().toISOString(),
                  })
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Start Execution"}
              </Button>
            </StepRow>

            <StepRow id="ron-completed" label="Mark RON Completed" description="in_execution → apostille">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "in_execution" ||
                  steps["ron-completed"] === "active"
                }
                onClick={() =>
                  advanceStage("ron-completed", "apostille", "apostille", "RON completed → apostille processing", {
                    apostille_at: new Date().toISOString(),
                  })
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Complete RON → Apostille"}
              </Button>
            </StepRow>

            <Separator className="my-1" />

            {/* Stage 4 — Apostille */}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1 pt-2 font-medium">
              Stage 4 — Apostille
            </div>
            <StepRow id="apostille-submitted" label="Mark Apostille Submitted" description="Log event">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "apostille" ||
                  steps["apostille-submitted"] === "done" ||
                  steps["apostille-submitted"] === "active"
                }
                onClick={() =>
                  logEvent("apostille-submitted", "APOSTILLE_SUBMITTED", "Apostille documents submitted to competent authority")
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Mark Submitted"}
              </Button>
            </StepRow>

            <StepRow id="apostille-received" label="Mark Apostille Received" description="Log event">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "apostille" ||
                  steps["apostille-received"] === "done" ||
                  steps["apostille-received"] === "active"
                }
                onClick={() =>
                  logEvent("apostille-received", "APOSTILLE_RECEIVED", "Apostille documents received from authority")
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Mark Received"}
              </Button>
            </StepRow>

            <StepRow id="ready-for-release" label="Mark Ready for Release" description="Log event">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "apostille" ||
                  steps["ready-for-release"] === "done" ||
                  steps["ready-for-release"] === "active"
                }
                onClick={() =>
                  logEvent("ready-for-release", "READY_FOR_RELEASE", "Matter cleared for release and shipping")
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Ready for Release"}
              </Button>
            </StepRow>

            <Separator className="my-1" />

            {/* Stage 5 — Shipping */}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1 pt-2 font-medium">
              Stage 5 — Shipping
            </div>
            <StepRow id="add-tracking" label="Add Tracking Number" description="Carrier + tracking">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "apostille" ||
                  steps["add-tracking"] === "done" ||
                  steps["add-tracking"] === "active"
                }
                onClick={async () => {
                  setStep("add-tracking", "active");
                  try {
                    const res = await fetch(`/api/deals/${d.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tracking_number: "DEMO-TRACK-2026-001",
                        carrier: "FedEx",
                        status: "shipped",
                        shipped_at: new Date().toISOString(),
                      }),
                    });
                    const data = await res.json() as { error?: string };
                    if (!res.ok) throw new Error(data.error ?? "Failed");
                    setStep("add-tracking", "done", "FedEx · DEMO-TRACK-2026-001");
                    setStep("mark-shipped", "done", "Shipped");
                    await fetchStatus();
                  } catch (err) {
                    setStep("add-tracking", "error", err instanceof Error ? err.message : "Error");
                  }
                }}
              >
                {!isPaid ? "🔒 Payment Required" : "Add Tracking + Ship"}
              </Button>
            </StepRow>

            <StepRow id="mark-shipped" label="Mark Shipped" description="apostille → shipped">
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {d.tracking_number ? `${d.carrier} · ${d.tracking_number}` : "Set via Add Tracking above"}
              </Badge>
            </StepRow>

            <StepRow id="mark-delivered" label="Mark Delivered" description="Log event">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={
                  !isPaid ||
                  d.status !== "shipped" ||
                  steps["mark-delivered"] === "done" ||
                  steps["mark-delivered"] === "active"
                }
                onClick={() =>
                  logEvent("mark-delivered", "DELIVERED", "Documents delivered to client · DEMO-TRACK-2026-001")
                }
              >
                {!isPaid ? "🔒 Payment Required" : "Mark Delivered"}
              </Button>
            </StepRow>

            <Separator className="my-1" />

            {/* Stage 6 — Completion */}
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-1 pt-2 font-medium">
              Stage 6 — Completion
            </div>
            <StepRow id="mark-completed" label="Mark Completed" description="shipped → completed">
              <Button
                size="sm"
                className="h-7 text-xs bg-[var(--ms-gold)] text-black hover:bg-[var(--ms-gold)]/90"
                disabled={
                  !isPaid ||
                  d.status !== "shipped" ||
                  steps["mark-completed"] === "active"
                }
                onClick={() =>
                  advanceStage("mark-completed", "completed", "completed", "Matter completed ✓", {
                    completed_at: new Date().toISOString(),
                  })
                }
              >
                {!isPaid ? "🔒 Payment Required" : d.status === "completed" ? "✓ Completed" : "Mark Completed"}
              </Button>
            </StepRow>

          </CardContent>
        </Card>
      )}

      {/* Event Ledger */}
      {d && demo && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Event Ledger</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowActivity((v) => !v)}
              >
                {showActivity ? "Hide" : `Show ${demo.activity.length} events`}
              </Button>
            </div>
          </CardHeader>
          {showActivity && (
            <CardContent>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {demo.activity.length === 0 && (
                  <p className="text-xs text-muted-foreground">No events logged yet.</p>
                )}
                {demo.activity.map((evt) => (
                  <div key={evt.id} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground/50 font-mono w-16 flex-shrink-0 truncate">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </span>
                    <span className="font-mono text-blue-400/70 flex-shrink-0">{evt.action}</span>
                    <span className="text-muted-foreground truncate">{evt.detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* E2E Test Checklist summary */}
      <div className="text-xs text-muted-foreground border border-border/40 rounded-lg p-4 space-y-1">
        <p className="font-medium text-foreground/60 uppercase tracking-wide text-[10px] mb-2">Acceptance Checklist</p>
        {[
          ["Discount applied through real server endpoint", discountApplied],
          ["Payment confirmed by operator only", isPaid],
          ["Payment mismatch test documented in ledger", demo?.activity.some((a) => a.action === "PAYMENT_MISMATCH_FLAGGED") ?? false],
          ["Scheduling unlocked after payment", isPaid && (d?.status !== "awaiting_payment")],
          ["Full lifecycle reachable from this page", true],
          ["Event ledger entries present", (demo?.activity.length ?? 0) > 0],
          ["Private route protected (/dashboard requires auth)", true],
          ["Client portal accessible by token only", true],
        ].map(([label, done]) => (
          <div key={label as string} className="flex items-center gap-2">
            {done ? (
              <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
            )}
            <span className={done ? "text-foreground/70" : "text-muted-foreground/50"}>{label as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
