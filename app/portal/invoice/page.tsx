"use client";

import { useRef } from "react";
import { usePortal } from "@/components/portal/portal-context";
import { formatCurrency } from "@/lib/format";
import { PricingBreakdown } from "@/components/shared/PricingBreakdown";
import type { PricingBreakdownData } from "@/components/shared/PricingBreakdown";
import { WisePaymentCard } from "@/components/portal/WisePaymentCard";
import { buildWisePaymentUrl } from "@/lib/payments/wiseUrl";

export default function ClientInvoicePage() {
  const { deal, isLoading } = usePortal();
  const printRef = useRef<HTMLDivElement | null>(null);

  const print = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=860,height=1120");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Invoice — The Milano Seal</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:letter portrait;margin:.75in .85in}
  html,body{background:#f9f6f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'Cormorant Garamond',Georgia,serif;color:#2a2520}
  .ci-card{background:#f9f6f0;color:#2a2520;padding:52px 60px;font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;position:relative;min-height:640px}
  .ci-brand{font-family:'Playfair Display',Georgia,serif;font-size:11px;color:#c6a55a;letter-spacing:.12em;text-transform:uppercase;text-align:center;margin-bottom:4px}
  .ci-tag{font-size:8px;letter-spacing:.28em;text-transform:uppercase;color:#a8894a;text-align:center;margin-bottom:14px}
  .ci-hr{border:none;border-top:.75px solid #d4c9b0;margin:12px 0}
  .ci-title{text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:600;margin-bottom:16px}
  .ci-cols{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;margin-bottom:14px}
  .ci-col-bill{border-right:.75px solid #d4c9b0;padding-right:14px}
  .ci-h-block{font-size:7.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#a8894a;margin-bottom:6px}
  .ci-col-name{font-size:13px}
  .ci-col-sub{font-size:11px;color:#777}
  .ci-matter-section{margin:8px 0}
  .ci-row{display:flex;justify-content:space-between;border-bottom:.75px solid #d4c9b0;padding:6px 0;font-size:13px}
  .ci-total{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-top:1px solid #c6a55a;margin-top:6px}
  .ci-paid-status{color:#4a8e6b}
  .ci-stamp{position:absolute;bottom:36px;right:36px;width:44px;height:44px;border-radius:50%;background:#c6a55a;display:flex;align-items:center;justify-content:center}
  .ci-stamp-check{font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#f9f6f0}
  .ci-footer-note{margin-top:22px;text-align:center;font-size:7px;color:#9a8f7a;letter-spacing:.18em;text-transform:uppercase}
</style></head>
<body>${printRef.current.innerHTML}
<script>
  document.fonts.ready.then(function(){
    setTimeout(function(){window.print();window.close();},200);
  });
</script>
</body></html>`;
    win.document.write(html);
    win.document.close();
  };

  if (isLoading) {
    return (
      <div style={{ color: "rgba(255,255,255,.4)" }}>Loading invoice…</div>
    );
  }
  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  // Use payment_amount_due from the safe API — no internal cost/margin fields
  const subtotal = Number(deal.payment_amount_due ?? deal.amount_due ?? 0);
  const isPlatformFeeOnly = deal.is_platform_fee_only === true;
  const paid =
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.payment_status === "payment_confirmed" ||
    deal.is_paid_and_released;

  // Use the stored wise_reference from the API, fall back to a deterministic reference
  const wiseRef =
    deal.wise_reference ??
    `MS-${(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}`;

  const pricingData: PricingBreakdownData = {
    lane: isPlatformFeeOnly ? "Platform Fee Only" : deal.assigned_lane ?? null,
    basePrice: subtotal > 0 ? subtotal : null,
    retainerPaid: null,
    addOns: [],
    included: isPlatformFeeOnly
      ? [
          "Required platform/state fee",
          "Milano Seal service fee waived",
          "External platform payment",
        ]
      : [
          "Remote Online Notarization (RON)",
          "Apostille coordination",
          "International courier release",
          "Custody chain documentation",
        ],
    total: subtotal > 0 ? subtotal : null,
    balanceDue: paid ? 0 : subtotal > 0 ? subtotal : null,
    paymentStatus: deal.payment_status,
    wiseReference: !paid && !isPlatformFeeOnly ? wiseRef : null,
  };

  return (
    <div>
      <div className="ci-eyebrow">Your Invoice</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 0,
        }}
      >
        <h1 className="ci-h1">Invoice</h1>
        <button
          onClick={print}
          style={{
            background: "transparent",
            color: "#C6A55A",
            border: "1px solid rgba(198,165,90,0.5)",
            borderRadius: 6,
            padding: "9px 20px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "#C6A55A";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(198,165,90,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(198,165,90,0.5)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          ↓ Download / Print
        </button>
      </div>

      {/* Digital pricing summary — not included in print layout */}
      <div style={{ marginBottom: 16 }}>
        <PricingBreakdown
          data={pricingData}
          showPaymentButton={!paid && !isPlatformFeeOnly && subtotal > 0}
          onPaymentAction={() => {
            window.location.href = "/portal/messages";
          }}
        />
      </div>

      {isPlatformFeeOnly ? (
        <div
          style={{
            marginBottom: 24,
            border: "1px solid rgba(198,165,90,.28)",
            borderRadius: 18,
            padding: 20,
            background: "rgba(198,165,90,.06)",
            color: "rgba(255,255,255,.86)",
          }}
        >
          <div
            style={{
              color: "#C6A55A",
              fontSize: 11,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            External Platform Payment
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            {formatCurrency(subtotal)} required platform/state fee
          </div>
          <div style={{ color: "rgba(255,255,255,.62)", lineHeight: 1.6 }}>
            Founder courtesy pricing applied. The Milano Seal service fee is waived.
            You are only responsible for the required platform/state fee shown for
            this notarization. Payment is completed through the external notary
            platform link provided by your coordinator.
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <WisePaymentCard
            amountDue={subtotal}
            currency={deal.currency ?? "USD"}
            paymentStatus={deal.payment_status ?? (paid ? "paid" : "awaiting_payment")}
            wiseReference={wiseRef}
            wisePaymentUrl={
              deal.wise_payment_url ??
              buildWisePaymentUrl({
                wiseReference: wiseRef,
                amountDue: subtotal,
                currency: deal.currency,
              })
            }
            paidAt={deal.paid_at ?? null}
          />
        </div>
      )}

      <div className="ci-shell">
        <div className="ci-paper">
          <div ref={printRef} className="ci-card">
            <div className="ci-brand">The Milano Seal™</div>
            <div className="ci-tag">Sealing Trust in Every Signature</div>
            <hr className="ci-hr" />
            <div className="ci-title">
              {paid ? "Paid & Released" : "Final Invoice"}
            </div>

            <div className="ci-cols">
              <div className="ci-col-bill">
                <div className="ci-h-block">Bill To</div>
                <div className="ci-col-name">{deal.client_name ?? "—"}</div>
                <div className="ci-col-sub">
                  {deal.destination_country ?? "—"}
                </div>
              </div>
              <div>
                <div className="ci-h-block">Invoice</div>
                <div className="ci-col-sub">
                  # {(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}
                </div>
                <div className="ci-col-sub">
                  Issued{" "}
                  {deal.created_at
                    ? new Date(deal.created_at).toLocaleDateString()
                    : ""}
                </div>
              </div>
            </div>

            <hr className="ci-hr" />

            <div className="ci-matter-section">
              <div className="ci-h-block">Matter</div>
              <div className="ci-row">
                <span>{deal.document_type ?? "Document execution"}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {isPlatformFeeOnly && (
                <div className="ci-row">
                  <span>Milano Seal service fee</span>
                  <span>Waived</span>
                </div>
              )}
            </div>

            {!paid && subtotal > 0 && (
              <div className="ci-total">
                <span>{isPlatformFeeOnly ? "Platform Fee Due" : "Amount Due"}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            )}

            {paid && (
              <>
                <div className="ci-total">
                  <span>Status</span>
                  <span className="ci-paid-status">PAID IN FULL</span>
                </div>
                <div className="ci-stamp">
                  <span className="ci-stamp-check">✓</span>
                </div>
              </>
            )}

            <div className="ci-footer-note">
              Performed in compliance with applicable Florida notarial law · FL
              Notary #668288
            </div>
          </div>
        </div>

        <div className="ci-coord">
          <div className="ci-coord-label">Your Coordinator</div>
          <div className="ci-coord-row">
            <div className="ci-coord-avatar">
              <span className="ci-coord-initial">N</span>
            </div>
            <div>
              <div className="ci-coord-name">Nicholas Milano</div>
              <div className="ci-coord-sub">
                FL Notary #668288 · International Document Execution
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
