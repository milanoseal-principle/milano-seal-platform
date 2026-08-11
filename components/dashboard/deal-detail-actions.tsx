"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarClock,
  ShieldCheck,
  Stamp,
  Truck,
  CheckCircle2,
  AlertCircle,
  CircleDollarSign,
  UserPlus,
  XCircle,
  Undo2,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  id: string;
  dealId: string;
  status: string;
  paymentStatus: string;
  amount: number;
  assignee: string | null;
}

const NEXT_STAGE: Record<string, { stage: string; label: string }> = {
  new: { stage: "reviewing", label: "Mark as In Review" },
  reviewing: { stage: "quoted", label: "Mark as Quoted" },
  quoted: { stage: "awaiting_payment", label: "Send for Payment" },
  awaiting_payment: { stage: "scheduled", label: "Mark Scheduled" },
  scheduled: { stage: "in_execution", label: "Begin Execution" },
  in_execution: { stage: "apostille", label: "Send to Apostille" },
  apostille: { stage: "shipped", label: "Mark Shipped" },
  shipped: { stage: "completed", label: "Mark Completed" },
};

export function DealDetailActions({
  id,
  dealId,
  status,
  paymentStatus,
  amount,
  assignee: initialAssignee,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [assignee, setAssignee] = useState(initialAssignee ?? "");

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");

  const [shipOpen, setShipOpen] = useState(false);
  const [carrier, setCarrier] = useState("FedEx International Priority");
  const [tracking, setTracking] = useState("");

  const [payOpen, setPayOpen] = useState(false);
  const [payAmt, setPayAmt] = useState(String(amount));
  const [payMethod, setPayMethod] = useState("wise");
  const [payRef, setPayRef] = useState("");

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmt, setRefundAmt] = useState(String(amount));
  const [refundReason, setRefundReason] = useState("");

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const isPaid = paymentStatus === "paid";
  const isRefunded = paymentStatus === "refunded";
  const isDisputed = paymentStatus === "disputed";
  const isFailed = paymentStatus === "failed";
  const next = NEXT_STAGE[status];
  const isTerminal = status === "completed" || status === "lost";
  const advanceBlockedByPayment =
    next &&
    ["scheduled", "in_execution", "apostille", "shipped", "completed"].includes(
      next.stage,
    ) &&
    !isPaid;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function moveStage(stage: string, label?: string) {
    const res = await fetch("/api/admin/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId, stage }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || `Failed (${res.status})`);
      return false;
    }
    toast.success(label ?? `Moved to ${stage}`);
    refresh();
    return true;
  }

  async function patchDeal(body: Record<string, unknown>, successMsg: string) {
    const res = await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || `Failed (${res.status})`);
      return false;
    }
    toast.success(successMsg);
    refresh();
    return true;
  }

  async function postScheduledAction(
    path: "schedule" | "execute" | "apostille",
    body: Record<string, unknown> = {},
  ): Promise<boolean> {
    const res = await fetch(`/api/deals/${id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        toast.error("Payment required before this stage.");
      } else {
        toast.error(data.error || `Failed (${res.status})`);
      }
      return false;
    }
    return true;
  }

  async function onAdvance() {
    if (!next) return;
    if (advanceBlockedByPayment) {
      toast.error("Payment must be cleared before advancing further.");
      return;
    }

    if (next.stage === "scheduled") {
      setScheduleOpen(true);
      return;
    }
    if (next.stage === "shipped") {
      setShipOpen(true);
      return;
    }
    await moveStage(next.stage, `${next.label} ✓`);
  }

  async function onScheduleConfirm() {
    if (!scheduledAt) {
      toast.error("Pick a date and time.");
      return;
    }
    const ok = await postScheduledAction("schedule", {
      execution_date: new Date(scheduledAt).toISOString(),
    });
    if (ok) {
      if (scheduleNote.trim()) {
        await patchDeal({ notes: scheduleNote.trim() }, "Note saved");
      }
      toast.success("Scheduled");
      setScheduleOpen(false);
      setScheduledAt("");
      setScheduleNote("");
      refresh();
    }
  }

  async function onShipConfirm() {
    if (!tracking.trim() || !carrier.trim()) {
      toast.error("Carrier + tracking required.");
      return;
    }
    const patched = await patchDeal(
      {
        tracking_number: tracking.trim(),
        carrier: carrier.trim(),
      },
      "Tracking saved",
    );
    if (patched) {
      const moved = await moveStage("shipped", "Marked Shipped");
      if (moved) {
        setShipOpen(false);
        setTracking("");
      }
    }
  }

  async function onPaymentConfirm() {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    const ok = await patchDeal(
      {
        payment_status: "paid",
        payment_method: payMethod,
        payment_amount_received: amt,
        payment_reference: payRef.trim() || undefined,
      },
      "Payment confirmed",
    );
    if (ok) {
      setPayOpen(false);
      setPayRef("");
    }
  }

  async function onRefundConfirm() {
    const amt = Number(refundAmt);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid refund amount.");
      return;
    }
    const ok = await patchDeal(
      {
        payment_status: "refunded",
        refund_amount: amt,
        notes: refundReason.trim() || undefined,
      },
      "Marked refunded",
    );
    if (ok) {
      setRefundOpen(false);
      setRefundReason("");
    }
  }

  async function onDisputeConfirm() {
    if (!disputeReason.trim()) {
      toast.error("Add a brief reason so the audit log captures it.");
      return;
    }
    const ok = await patchDeal(
      {
        payment_status: "disputed",
        dispute_reason: disputeReason.trim(),
      },
      "Flagged as disputed",
    );
    if (ok) {
      setDisputeOpen(false);
      setDisputeReason("");
    }
  }

  async function onAssign() {
    const value = assignee.trim();
    if (!value) {
      toast.error("Enter an assignee name.");
      return;
    }
    await patchDeal({ assignee: value }, `Assigned to ${value}`);
  }

  function iconForStage(stage: string) {
    if (stage === "scheduled") return <CalendarClock className="w-4 h-4" />;
    if (stage === "in_execution") return <ShieldCheck className="w-4 h-4" />;
    if (stage === "apostille") return <Stamp className="w-4 h-4" />;
    if (stage === "shipped") return <Truck className="w-4 h-4" />;
    if (stage === "completed") return <CheckCircle2 className="w-4 h-4" />;
    return null;
  }

  return (
    <div className="space-y-4">
      {advanceBlockedByPayment && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-await">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            Payment must be cleared before advancing further.
          </span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {next && !isTerminal ? (
          <Button
            type="button"
            disabled={isPending || !!advanceBlockedByPayment}
            onClick={onAdvance}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
          >
            {iconForStage(next.stage)}
            <span className="ml-2">{next.label}</span>
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-secondary text-muted-foreground text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {isTerminal ? "Closed" : "No further stage"}
          </div>
        )}

        {!isTerminal && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => moveStage("lost", "Marked as Lost")}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Mark as Lost
          </Button>
        )}
      </div>

      {(isRefunded || isDisputed || isFailed) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            Payment status:{" "}
            <span className="font-medium uppercase tracking-wider">
              {paymentStatus}
            </span>{" "}
            — pipeline progression is halted until resolved.
          </span>
        </div>
      )}

      {!isPaid && !isRefunded && !isDisputed && !isFailed && (
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full border-gold text-gold hover:bg-gold-soft"
            >
              <CircleDollarSign className="w-4 h-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Confirm payment</DialogTitle>
              <DialogDescription>
                This marks the matter as paid and unlocks execution stages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pay-amount"
                    className="text-xs text-muted-foreground"
                  >
                    Amount
                  </Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    step="0.01"
                    value={payAmt}
                    onChange={(e) => setPayAmt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pay-method"
                    className="text-xs text-muted-foreground"
                  >
                    Method
                  </Label>
                  <select
                    id="pay-method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:border-primary text-foreground"
                  >
                    {["wise", "stripe"].map((m) => (
                      <option key={m} value={m} className="bg-card">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="pay-ref"
                  className="text-xs text-muted-foreground"
                >
                  Reference (optional)
                </Label>
                <Input
                  id="pay-ref"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Wise transaction ID or wire confirmation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={onPaymentConfirm}
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Mark Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isPaid && (
        <div className="grid sm:grid-cols-2 gap-2">
          <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Mark Refunded
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Issue refund</DialogTitle>
                <DialogDescription>
                  Refunding halts pipeline progression. Process the refund in
                  Wise (or wherever the original payment landed) before marking
                  it here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="refund-amount"
                    className="text-xs text-muted-foreground"
                  >
                    Refund amount
                  </Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    step="0.01"
                    value={refundAmt}
                    onChange={(e) => setRefundAmt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="refund-reason"
                    className="text-xs text-muted-foreground"
                  >
                    Reason (saved to notes)
                  </Label>
                  <Textarea
                    id="refund-reason"
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Customer canceled before scheduling…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setRefundOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onRefundConfirm}
                  disabled={isPending}
                  className="bg-red-500/80 text-white hover:bg-red-500"
                >
                  Confirm refund
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Flag className="w-4 h-4 mr-2" />
                Flag Dispute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Flag as disputed
                </DialogTitle>
                <DialogDescription>
                  Use when a chargeback notice arrives or the customer raises a
                  payment dispute. Pipeline progression is halted until the
                  status is resolved.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="dispute-reason"
                    className="text-xs text-muted-foreground"
                  >
                    Dispute reason
                  </Label>
                  <Textarea
                    id="dispute-reason"
                    rows={3}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Wise dispute case #… / chargeback reason…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDisputeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onDisputeConfirm}
                  disabled={isPending || !disputeReason.trim()}
                  className="bg-amber-500/80 text-[#0A0A0A] hover:bg-amber-500"
                >
                  Flag dispute
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Schedule execution</DialogTitle>
            <DialogDescription>
              Pick the date/time the matter will be executed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="schedule-when"
                className="text-xs text-muted-foreground"
              >
                Execution date &amp; time
              </Label>
              <Input
                id="schedule-when"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="schedule-note"
                className="text-xs text-muted-foreground"
              >
                Note (optional)
              </Label>
              <Textarea
                id="schedule-note"
                rows={3}
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
                placeholder="Internal context for the appointment…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onScheduleConfirm}
              disabled={isPending || !scheduledAt}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Ship documents</DialogTitle>
            <DialogDescription>
              Carrier + tracking number are saved on the matter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="ship-carrier"
                className="text-xs text-muted-foreground"
              >
                Carrier
              </Label>
              <Input
                id="ship-carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="ship-tracking"
                className="text-xs text-muted-foreground"
              >
                Tracking number
              </Label>
              <Input
                id="ship-tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="e.g. 7831 4823 9817"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShipOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onShipConfirm}
              disabled={isPending || !tracking || !carrier}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-border p-3 space-y-2 bg-background/40">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          Assignee
        </Label>
        <div className="flex gap-2">
          <Input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Operator name"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !assignee.trim()}
            onClick={onAssign}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
