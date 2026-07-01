"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STATUS_LABEL, type PaymentStatus } from "@/lib/payments/state-machine";
import type { PaymentType } from "@/lib/wise/reference";

interface PaymentSession {
  paymentUrl: string;
  reference: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  existing?: boolean;
  mode?: "production" | "fallback";
}

interface PaymentGateProps {
  matterId: string;
  matterReference: string;
  paymentType?: PaymentType;
}

export function PaymentGate({
  matterId,
  matterReference,
  paymentType = "retainer",
}: PaymentGateProps) {
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("awaiting_payment");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/deals/${matterId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentType }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(json.error || `Failed (${res.status})`);
        }
        setSession(json as PaymentSession);
        setStatus(json.status as PaymentStatus);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not generate payment session.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matterId, paymentType]);

  useEffect(() => {
    if (!session?.reference) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`payment-${session.reference}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `wise_reference=eq.${session.reference}`,
        },
        (payload) => {
          const next = payload.new as { payment_status?: PaymentStatus };
          if (next.payment_status) setStatus(next.payment_status);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.reference]);

  if (loading) return <PaymentLoadingState />;
  if (error) return <PaymentErrorState message={error} />;
  if (!session) return <PaymentErrorState message="No session available." />;
  if (status === "payment_confirmed")
    return <PaymentConfirmedState reference={session.reference} />;
  if (status === "refunded")
    return <PaymentErrorState message="This payment has been refunded." />;

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  // Determine if this is a prefilled link (production mode = prefilled)
  const isPrefilled = session.mode === "production";
  const manualFallbackRequired = !isPrefilled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-[#14141a] to-[#0a0a0d] border border-[#D4AF37]/25 rounded-sm p-8 max-w-2xl mx-auto"
      style={{
        boxShadow:
          "0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.08)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#F4E5B8] via-[#D4AF37] to-[#B8960A] flex items-center justify-center">
            <Shield className="w-5 h-5 text-black/85" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[9px] text-[#D4AF37]/70 font-mono tracking-[0.3em] uppercase mb-1">
              Trust Engine • Payment Gate
            </div>
            <div className="font-serif text-xl text-white">
              Secure {paymentType === "retainer" ? "Retainer" : "Payment"}{" "}
              Authorization
            </div>
          </div>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      {/* Payment details card with copy buttons */}
      <div className="bg-black/40 border border-[#D4AF37]/10 rounded-sm p-5 mb-6 space-y-3">
        <PaymentRow
          label="Matter Reference"
          value={matterReference}
          mono
          accent
        />
        <PaymentRow
          label="Payment Reference"
          value={session.reference}
          mono
          onCopy={() => handleCopy("reference", session.reference)}
          copied={copiedField === "reference"}
        />
        <PaymentRow
          label="Description"
          value={session.description}
          onCopy={() => handleCopy("description", session.description)}
          copied={copiedField === "description"}
        />
        <div className="pt-3 mt-3 border-t border-[#D4AF37]/10">
          <PaymentRow
            label="Amount Due"
            value={`${session.amount.toFixed(2)} ${session.currency}`}
            highlight
            onCopy={() =>
              handleCopy(
                "amount",
                `${session.amount.toFixed(2)} ${session.currency}`,
              )
            }
            copied={copiedField === "amount"}
          />
        </div>
      </div>

      {/* Conditional prefill / manual fallback notice */}
      <div className="bg-[#D4AF37]/[0.04] border border-[#D4AF37]/20 rounded-sm p-4 mb-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400 leading-relaxed">
            {isPrefilled ? (
              "Wise will open with your matter-specific payment details prepared. Do not modify the reference."
            ) : (
              "Wise may ask you to enter the amount manually. Enter the exact amount and reference shown above. Do not modify the reference."
            )}
          </div>
        </div>
      </div>

      {/* Always-visible reference reminder */}
      <div className="bg-black/30 border border-[#D4AF37]/15 rounded-sm p-4 mb-4">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400 leading-relaxed">
            Your payment reference is:{" "}
            <span className="font-mono text-[#D4AF37] font-semibold">
              {session.reference}
            </span>
            . Use this exact reference. The Milano Seal™ uses it to reconcile
            your payment and unlock execution.
          </div>
        </div>
      </div>

      {/* Payment-gated execution */}
      <div className="bg-[#D4AF37]/[0.04] border border-[#D4AF37]/20 rounded-sm p-4 mb-6">
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-[#D4AF37] font-semibold mb-1 tracking-wider uppercase">
              Payment-Gated Execution
            </div>
            <div className="text-xs text-gray-400 leading-relaxed">
              Execution begins only after payment confirmation and
              reconciliation. Your matter reference and payment reference are
              used to match the transfer to your file. Do not modify the
              reference.
            </div>
          </div>
        </div>
      </div>

      {/* CTA button — shows exact retainer amount dynamically */}
      <a
        href={session.paymentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-4 bg-gradient-to-r from-[#F4E5B8] via-[#D4AF37] to-[#B8960A] hover:brightness-110 text-black/90 font-semibold tracking-[0.2em] uppercase text-sm transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: "0 8px 24px rgba(212,175,55,0.25)" }}
        >
          Pay Retainer — {session.amount.toFixed(2)} {session.currency}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </a>

      {/* Mobile return note */}
      <div className="mt-4 text-center text-[10px] text-gray-600 font-mono tracking-[0.15em]">
        After completing payment on Wise, return to this page. Your portal will
        update once payment is reconciled.
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-mono text-gray-500 tracking-[0.2em] uppercase">
        <span>Encrypted</span>
        <span className="text-[#D4AF37]/30">/</span>
        <span>Wise Verified</span>
        <span className="text-[#D4AF37]/30">/</span>
        <span>Auto-Reconciliation</span>
      </div>
    </motion.div>
  );
}

function PaymentRow({
  label,
  value,
  mono = false,
  accent = false,
  highlight = false,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  highlight?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="text-[9px] text-gray-500 uppercase tracking-[0.3em] flex-shrink-0">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`text-right ${mono ? "font-mono" : ""} ${
            highlight
              ? "text-2xl font-semibold text-[#D4AF37]"
              : accent
                ? "text-sm text-[#D4AF37] font-semibold"
                : "text-xs text-white"
          }`}
        >
          {value}
        </div>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className={`transition-colors ${
              copied
                ? "text-[#D4AF37]"
                : "text-[#D4AF37]/50 hover:text-[#D4AF37]"
            }`}
            title={copied ? "Copied ✓" : "Copy"}
          >
            {copied ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<
    PaymentStatus,
    { color: string; bg: string; border: string; Icon: typeof Clock }
  > = {
    awaiting_payment: {
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/30",
      Icon: Clock,
    },
    payment_pending: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      Icon: Clock,
    },
    payment_confirmed: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      Icon: CheckCircle2,
    },
    payment_failed: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      Icon: AlertCircle,
    },
    partially_paid: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      Icon: Clock,
    },
    refunded: {
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
      Icon: AlertCircle,
    },
  };
  const c = config[status];
  const { Icon } = c;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 ${c.bg} ${c.border} border rounded-sm`}
    >
      <Icon className={`w-3 h-3 ${c.color}`} />
      <span
        className={`text-[10px] font-mono font-semibold ${c.color} tracking-[0.2em]`}
      >
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}

function PaymentLoadingState() {
  return (
    <div className="bg-[#0a0a0d] border border-[#D4AF37]/15 rounded-sm p-12 max-w-2xl mx-auto flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      <div className="text-xs text-gray-500 font-mono tracking-[0.3em] uppercase">
        Generating Secure Session
      </div>
    </div>
  );
}

function PaymentErrorState({ message }: { message: string }) {
  return (
    <div className="bg-[#0a0a0d] border border-red-500/30 rounded-sm p-10 max-w-2xl mx-auto text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <div className="text-[10px] text-red-400 font-mono tracking-[0.4em] uppercase mb-2">
        Payment Setup Issue
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
    </div>
  );
}

function PaymentConfirmedState({ reference }: { reference: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-[#0d1612] to-[#0a0a0d] border border-emerald-500/30 rounded-sm p-10 max-w-2xl mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5"
        style={{ boxShadow: "0 0 32px rgba(16,185,129,0.3)" }}
      >
        <CheckCircle2 className="w-8 h-8 text-emerald-400" strokeWidth={2.2} />
      </motion.div>

      <div className="text-[10px] text-emerald-400 font-mono tracking-[0.4em] uppercase mb-2">
        Payment Confirmed
      </div>
      <h3 className="font-serif text-2xl text-white mb-2">
        Execution Authorized
      </h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Your matter has entered active execution. The Trust Engine has unlocked
        the operational queue.
      </p>

      <div className="bg-black/30 border border-emerald-500/15 rounded-sm p-4 inline-block">
        <div className="text-[9px] text-gray-500 uppercase tracking-[0.3em] mb-1">
          Reference
        </div>
        <div className="text-sm font-mono text-emerald-400 font-semibold">
          {reference}
        </div>
      </div>
    </motion.div>
  );
}
