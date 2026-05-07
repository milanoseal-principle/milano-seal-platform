"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";

interface Deal {
  id: string;
  client_name: string | null;
  email: string | null;
  document_type: string | null;
  destination_country: string | null;
  country: string | null;
  amount: number | null;
  payment_status: string | null;
  status: string | null;
  invoice_subtotal: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  created_at: string | null;
}

type InvType = "proforma" | "final" | "paid";

const INV_LABEL: Record<InvType, string> = {
  proforma: "Pro Forma Invoice",
  final: "Final Invoice",
  paid: "Paid & Released",
};

export default function InvoiceStudio() {
  const { data: deals } = useApi<Deal[]>("/api/deals");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [type, setType] = useState<InvType>("proforma");
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedId && deals && deals.length > 0) {
      setSelectedId(deals[0].id);
    }
  }, [deals, selectedId]);

  const sel = useMemo(
    () => (deals ?? []).find((d) => d.id === selectedId) ?? null,
    [deals, selectedId],
  );

  const retainer = Number(sel?.invoice_retainer ?? 0);
  const subtotal = Number(
    sel?.invoice_subtotal ||
      sel?.amount ||
      (retainer > 0 ? Math.round(retainer * 2 * 100) / 100 : 0),
  );
  const balance = Number(sel?.invoice_balance ?? subtotal - retainer);

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
  @page{size:letter portrait;margin:.55in .65in}
  html,body{background:#f9f6f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'Cormorant Garamond',Georgia,serif;color:#2a2520}
  .inv-card{background:#f9f6f0;color:#2a2520;padding:36px 44px;font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;position:relative;min-height:600px}
  .inv-brand{font-family:'Playfair Display',Georgia,serif;font-size:11px;color:#c6a55a;letter-spacing:.12em;text-transform:uppercase;text-align:center;margin-bottom:4px}
  .inv-tag{font-size:8px;letter-spacing:.28em;text-transform:uppercase;color:#a8894a;text-align:center;margin-bottom:14px}
  .inv-hr{border:none;border-top:.75px solid #d4c9b0;margin:12px 0}
  .inv-title{text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:600;margin-bottom:16px}
  .inv-cols{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;margin-bottom:14px}
  .inv-col-bill{border-right:.75px solid #d4c9b0;padding-right:14px}
  .inv-col-label{font-size:7.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#a8894a;margin-bottom:6px}
  .inv-col-name{font-size:13px}
  .inv-col-sub{font-size:11px;color:#777}
  .inv-matter-section{margin:8px 0}
  .inv-row-l{display:flex;justify-content:space-between;border-bottom:.75px solid #d4c9b0;padding:6px 0;font-size:13px}
  .inv-total-l{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-top:1px solid #c6a55a;margin-top:6px}
  .inv-paid-status{color:#4a8e6b}
  .inv-stamp{position:absolute;bottom:36px;right:36px;width:44px;height:44px;border-radius:50%;background:#c6a55a;display:flex;align-items:center;justify-content:center}
  .inv-stamp-check{font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#f9f6f0}
  .inv-footer-note{margin-top:22px;text-align:center;font-size:7px;color:#9a8f7a;letter-spacing:.18em;text-transform:uppercase}
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

  return (
    <div>
      <div className="inv-eyebrow">Invoice Studio</div>
      <h1 className="inv-h1">Generate Invoice</h1>

      <div className="inv-grid">
        <div className="inv-list">
          <div className="inv-list-header">Matters</div>
          {(deals ?? []).map((d) => (
            <div
              key={d.id}
              className="inv-list-item"
              data-active={selectedId === d.id}
              onClick={() => setSelectedId(d.id)}
            >
              <div className="inv-list-id">{d.id.slice(0, 8)}…</div>
              <div className="inv-list-name">{d.client_name ?? "—"}</div>
              <div className="inv-list-amt">
                {formatCurrency(
                  Number(d.invoice_subtotal) ||
                    Number(d.amount) ||
                    (Number(d.invoice_retainer) > 0
                      ? Math.round(Number(d.invoice_retainer) * 2 * 100) / 100
                      : 0),
                )}
              </div>
            </div>
          ))}
          {(deals ?? []).length === 0 && (
            <div className="inv-list-empty">No matters yet.</div>
          )}
        </div>

        <div>
          <div className="inv-toolbar">
            <div className="inv-tabs">
              {(Object.keys(INV_LABEL) as InvType[]).map((t) => (
                <button
                  key={t}
                  className="inv-tab"
                  data-active={type === t}
                  onClick={() => setType(t)}
                >
                  {INV_LABEL[t]}
                </button>
              ))}
            </div>
            <button className="inv-print-btn" onClick={print} disabled={!sel}>
              Print / PDF
            </button>
          </div>

          {!sel ? (
            <div className="inv-empty">
              Select a matter from the list to preview an invoice.
            </div>
          ) : (
            <div className="inv-paper">
              <div ref={printRef}>
                <div className="inv-card">
                  <div className="inv-brand">The Milano Seal™</div>
                  <div className="inv-tag">
                    Sealing Trust in Every Signature
                  </div>
                  <hr className="inv-hr" />
                  <div className="inv-title">{INV_LABEL[type]}</div>

                  <div className="inv-cols">
                    <div className="inv-col-bill">
                      <div className="inv-col-label">Bill To</div>
                      <div className="inv-col-name">{sel.client_name}</div>
                      <div className="inv-col-sub">{sel.email}</div>
                      <div className="inv-col-sub">
                        {sel.destination_country ?? sel.country}
                      </div>
                    </div>
                    <div>
                      <div className="inv-col-label">Invoice</div>
                      <div className="inv-col-sub" style={{ fontSize: 11 }}>
                        # {sel.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="inv-col-sub">
                        Issued{" "}
                        {sel.created_at
                          ? new Date(sel.created_at).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  </div>

                  <hr className="inv-hr" />

                  <div className="inv-matter-section">
                    <div className="inv-col-label">Matter</div>
                    <div className="inv-row-l">
                      <span>{sel.document_type ?? "Document execution"}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </div>

                  {type === "proforma" && (
                    <div className="inv-total-l">
                      <span>Retainer Due Upon Engagement:</span>
                      <span>{formatCurrency(retainer)}</span>
                    </div>
                  )}

                  {type === "final" && (
                    <>
                      <div className="inv-row-l">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="inv-row-l">
                        <span>Retainer Received</span>
                        <span>−{formatCurrency(retainer)}</span>
                      </div>
                      <div className="inv-total-l">
                        <span>Balance Due</span>
                        <span>{formatCurrency(balance)}</span>
                      </div>
                    </>
                  )}

                  {type === "paid" && (
                    <>
                      <div className="inv-row-l">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="inv-total-l">
                        <span>Status</span>
                        <span className="inv-paid-status">PAID IN FULL</span>
                      </div>
                      <div className="inv-stamp">
                        <span className="inv-stamp-check">✓</span>
                      </div>
                    </>
                  )}

                  <div className="inv-footer-note">
                    Performed in compliance with applicable Florida notarial law
                    · FL Notary #668288
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
