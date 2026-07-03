"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, AlertTriangle, CheckCircle, XCircle, ShieldAlert } from "lucide-react";

const DISCOUNT_TYPES = [
  { value: "courtesy_discount", label: "Courtesy Discount" },
  { value: "relationship_pricing", label: "Relationship Pricing" },
  { value: "domestic_simple_notary", label: "Domestic Simple Notary" },
  { value: "platform_fee_only", label: "Platform Fee Only" },
  { value: "founder_exception", label: "Founder Exception" },
  { value: "hardship_adjustment", label: "Hardship Adjustment" },
  { value: "strategic_client", label: "Strategic Client" },
  { value: "correction_adjustment", label: "Correction Adjustment" },
];

type FounderDiscountOverridePanelProps = {
  dealId: string;
  currentAmount: number;
  currentPaymentStatus?: string | null;
  currentDealStatus?: string | null;
  role: string;
  existingDiscount?: {
    discount_type?: string | null;
    discount_amount?: number | null;
    discount_reason?: string | null;
    discount_note?: string | null;
    founder_price_override?: number | null;
    platform_fee_required?: number | null;
    service_fee_waived?: boolean | null;
    price_override_locked?: boolean | null;
  };
};

export default function FounderDiscountOverridePanel({
  dealId,
  currentAmount,
  currentPaymentStatus,
  role,
  existingDiscount = {},
}: FounderDiscountOverridePanelProps) {
  if (role !== "founder_admin") return null;

  const isLocked = existingDiscount.price_override_locked ?? false;
  const isPaid = currentPaymentStatus === "paid";

  const [finalClientPrice, setFinalClientPrice] = useState<string>(
    existingDiscount.founder_price_override != null
      ? String(existingDiscount.founder_price_override)
      : ""
  );
  const [discountType, setDiscountType] = useState<string>(
    existingDiscount.discount_type ?? ""
  );
  const [platformFeeRequired, setPlatformFeeRequired] = useState<string>(
    existingDiscount.platform_fee_required != null
      ? String(existingDiscount.platform_fee_required)
      : ""
  );
  const [serviceFeeWaived, setServiceFeeWaived] = useState<boolean>(
    existingDiscount.service_fee_waived ?? false
  );
  const [discountReason, setDiscountReason] = useState<string>(
    existingDiscount.discount_reason ?? ""
  );
  const [discountNote, setDiscountNote] = useState<string>(
    existingDiscount.discount_note ?? ""
  );
  const [adjustAfterPayment, setAdjustAfterPayment] = useState(false);
  const [fieldsUnlocked, setFieldsUnlocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fieldsDisabled = isLocked && !fieldsUnlocked;

  function validate(): string | null {
    const price = parseFloat(finalClientPrice);
    const fee = parseFloat(platformFeeRequired);

    if (finalClientPrice !== "" && (isNaN(price) || price < 0))
      return "Final client price must be 0 or greater.";
    if (platformFeeRequired !== "" && (isNaN(fee) || fee < 0))
      return "Platform fee must be 0 or greater.";
    if (discountType === "platform_fee_only" && platformFeeRequired === "")
      return "Platform fee is required for Platform Fee Only discount type.";
    if (serviceFeeWaived && !discountReason.trim())
      return "Discount reason is required when service fee is waived.";
    if (isPaid && !adjustAfterPayment)
      return "You must confirm adjustment after payment before applying.";
    return null;
  }

  async function callApi(body: Record<string, unknown>) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/founder-pricing-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setErrorMsg(data.code ?? "Request failed.");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error.");
    }
  }

  async function handleApply() {
    const err = validate();
    if (err) { setStatus("error"); setErrorMsg(err); return; }

    await callApi({
      dealId,
      finalClientPrice: finalClientPrice !== "" ? parseFloat(finalClientPrice) : undefined,
      discountType: discountType || undefined,
      discountAmount: currentAmount - (parseFloat(finalClientPrice) || 0),
      discountReason: discountReason || undefined,
      discountNote: discountNote || undefined,
      platformFeeRequired: platformFeeRequired !== "" ? parseFloat(platformFeeRequired) : undefined,
      serviceFeeWaived,
      adjustAfterPaymentConfirmed: adjustAfterPayment,
    });
  }

  async function handleLock() {
    await callApi({ dealId, lockOverride: true });
  }

  async function handleUnlock() {
    setFieldsUnlocked(true);
    await callApi({ dealId, unlockOverride: true });
  }

  async function handleClear() {
    await callApi({ dealId, clearOverride: true });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#C6A55A]/30 bg-[#0A0A0A] p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-[#C6A55A]" size={20} />
        <h2 className="text-[#C6A55A] font-semibold text-sm uppercase tracking-widest">
          Founder Pricing Override
        </h2>
        {isLocked && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 border border-amber-400/40 rounded px-2 py-0.5">
            <Lock size={12} /> Locked
          </span>
        )}
      </div>

      {/* Paid warning */}
      <AnimatePresence>
        {isPaid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 rounded-lg bg-amber-900/20 border border-amber-500/30 p-3"
          >
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-300 text-xs">
              This deal has already been marked as <strong>paid</strong>. Any pricing override will require acknowledgment below.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current amount display */}
      <div className="text-xs text-white/40">
        Current deal amount: <span className="text-white/70">${currentAmount.toFixed(2)}</span>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-[#C6A55A]/80 uppercase tracking-wide">Final Client Price ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={finalClientPrice}
            onChange={(e) => setFinalClientPrice(e.target.value)}
            disabled={fieldsDisabled}
            placeholder="e.g. 25.00"
            className="w-full rounded bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60 disabled:opacity-40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[#C6A55A]/80 uppercase tracking-wide">Discount Type</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            disabled={fieldsDisabled}
            className="w-full rounded bg-[#111] border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60 disabled:opacity-40"
          >
            <option value="">— Select —</option>
            {DISCOUNT_TYPES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[#C6A55A]/80 uppercase tracking-wide">Required Platform Fee ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={platformFeeRequired}
            onChange={(e) => setPlatformFeeRequired(e.target.value)}
            disabled={fieldsDisabled}
            placeholder="e.g. 25.00"
            className="w-full rounded bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60 disabled:opacity-40"
          />
        </div>

        <div className="space-y-1 flex flex-col justify-end">
          <label className="text-xs text-[#C6A55A]/80 uppercase tracking-wide">Service Fee Waived</label>
          <button
            type="button"
            onClick={() => !fieldsDisabled && setServiceFeeWaived((v) => !v)}
            disabled={fieldsDisabled}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${serviceFeeWaived ? "bg-[#C6A55A]" : "bg-white/10"} disabled:opacity-40`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${serviceFeeWaived ? "translate-x-6" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-[#C6A55A]/80 uppercase tracking-wide">Discount Reason</label>
        <input
          type="text"
          value={discountReason}
          onChange={(e) => setDiscountReason(e.target.value)}
          disabled={fieldsDisabled}
          placeholder="Brief reason for pricing adjustment"
          className="w-full rounded bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60 disabled:opacity-40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-[#C6A55A]/80 uppercase tracking-wide">Internal Note</label>
        <textarea
          value={discountNote}
          onChange={(e) => setDiscountNote(e.target.value)}
          disabled={fieldsDisabled}
          rows={2}
          placeholder="Internal note (never shown to client)"
          className="w-full rounded bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#C6A55A]/60 disabled:opacity-40 resize-none"
        />
      </div>

      {/* Adjust after payment checkbox */}
      <AnimatePresence>
        {isPaid && (
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={adjustAfterPayment}
              onChange={(e) => setAdjustAfterPayment(e.target.checked)}
              className="accent-[#C6A55A]"
            />
            <span className="text-xs text-amber-300">
              I confirm this pricing adjustment is being applied after payment has been received.
            </span>
          </motion.label>
        )}
      </AnimatePresence>

      {/* Status messages */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-green-400 text-xs"
          >
            <CheckCircle size={14} /> Override applied successfully.
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-red-400 text-xs"
          >
            <XCircle size={14} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={handleApply}
          disabled={status === "loading" || fieldsDisabled}
          className="flex items-center gap-1.5 bg-[#C6A55A] hover:bg-[#d4b46a] text-black text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
        >
          {status === "loading" ? "Applying…" : "Apply Founder Override"}
        </button>

        {!isLocked ? (
          <button
            onClick={handleLock}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 border border-[#C6A55A]/50 text-[#C6A55A] hover:bg-[#C6A55A]/10 text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
          >
            <Lock size={12} /> Lock Override
          </button>
        ) : (
          <button
            onClick={handleUnlock}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 border border-amber-400/50 text-amber-400 hover:bg-amber-400/10 text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
          >
            <Unlock size={12} /> Unlock Override
          </button>
        )}

        <button
          onClick={handleClear}
          disabled={status === "loading"}
          className="flex items-center gap-1.5 border border-white/20 text-white/50 hover:text-white hover:border-white/40 text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-40"
        >
          Clear Override
        </button>
      </div>
    </motion.div>
  );
}
