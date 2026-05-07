"use client";

import { usePortal } from "@/components/portal/portal-context";
import { formatCurrency } from "@/lib/format";

export default function ClientInvoicePage() {
  const { deal, isLoading } = usePortal();

  if (isLoading) {
    return <div style={{ color: "rgba(255,255,255,.4)" }}>Loading invoice…</div>;
  }
  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  const retainer = Number(deal.invoice_retainer ?? 0);
  const subtotal = Number(
    deal.invoice_subtotal ||
      deal.amount ||
      (retainer > 0 ? Math.round(retainer * 2 * 100) / 100 : 0),
  );
  const balance = Number(deal.invoice_balance ?? subtotal - retainer);
  const paid = deal.payment_status === "paid";

  return (
    <div>
      <div className="ci-eyebrow">Your Invoice</div>
      <h1 className="ci-h1">Invoice</h1>

      <div className="ci-shell">
        <div className="ci-paper">
          <div className="ci-card">
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
                <div className="ci-col-sub">{deal.email}</div>
                <div className="ci-col-sub">
                  {deal.destination_country ?? deal.country}
                </div>
              </div>
              <div>
                <div className="ci-h-block">Invoice</div>
                <div className="ci-col-sub">
                  # {deal.id.slice(0, 8).toUpperCase()}
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
            </div>

            {!paid && (
              <>
                <div className="ci-row">
                  <span>Retainer Received</span>
                  <span>−{formatCurrency(retainer)}</span>
                </div>
                <div className="ci-total">
                  <span>Balance Due</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
              </>
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
