"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";

interface Deal {
  id: string;
  client_name: string | null;
  email: string | null;
  phone: string | null;
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
  matter_status: string | null;
  service_type: string | null;
  signer_count: number | null;
  apostille_required: boolean | null;
  translation: boolean | null;
}

type InvType = "proforma" | "final" | "paid";

const INV_LABEL: Record<InvType, string> = {
  proforma: "Pro Forma Invoice",
  final: "Final Invoice",
  paid: "Paid & Released",
};

const PAYMENT_METHODS = [
  { label: "Wise", value: "wise.com/pay/me/nicholassamm1", icon: "W", note: "Verified settlement required" },
];

function InvSeals() {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "10px 0 14px" }}>
      {["APOSTILLE", "NOTARY", "AUTHENTICATION"].map((s) => (
        <div
          key={s}
          style={{
            border: ".75px solid #c6a55a",
            borderRadius: 2,
            padding: "2px 7px",
            fontSize: 6.5,
            letterSpacing: ".22em",
            color: "#c6a55a",
            textTransform: "uppercase",
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

function MedallionStamp({ check }: { check?: boolean }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: check ? "#4a8e6b" : "#c6a55a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(198,165,90,0.35)",
      }}
    >
      <span
        style={{
          fontFamily: "'Playfair Display',Georgia,serif",
          fontSize: check ? 22 : 20,
          color: "#f9f6f0",
          fontWeight: 700,
        }}
      >
        {check ? "✓" : "M"}
      </span>
    </div>
  );
}

interface InvCardProps {
  sel: Deal;
  type: InvType;
  subtotal: number;
  retainer: number;
  balance: number;
}

function ProForma({ sel, subtotal, retainer }: Omit<InvCardProps, "type" | "balance">) {
  const lineItems: { label: string; amount: number }[] = [];
  lineItems.push({ label: sel.document_type ?? "Document Execution Service", amount: subtotal });
  if (sel.apostille_required) lineItems.push({ label: "Apostille Processing", amount: 0 });
  if (sel.translation) lineItems.push({ label: "Certified Translation", amount: 0 });

  return (
    <div className="inv-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="inv-brand">The Milano Seal™</div>
          <div className="inv-tag">Sealing Trust with Every Signature</div>
        </div>
        <MedallionStamp />
      </div>

      <InvSeals />
      <hr className="inv-hr" />
      <div className="inv-title">Pro Forma Invoice</div>
      <div className="inv-subtitle">Engagement Retainer · Estimate Only</div>

      <div className="inv-cols">
        <div className="inv-col-bill">
          <div className="inv-col-label">Bill To</div>
          <div className="inv-col-name">{sel.client_name ?? "—"}</div>
          {sel.email && <div className="inv-col-sub">{sel.email}</div>}
          {sel.phone && <div className="inv-col-sub">{sel.phone}</div>}
          {(sel.destination_country ?? sel.country) && (
            <div className="inv-col-sub">{sel.destination_country ?? sel.country}</div>
          )}
        </div>
        <div>
          <div className="inv-col-label">Reference</div>
          <div className="inv-col-sub">#{sel.id.slice(0, 8).toUpperCase()}</div>
          <div className="inv-col-sub">
            Issued {sel.created_at ? new Date(sel.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
          </div>
          {sel.service_type && (
            <div style={{ marginTop: 4 }}>
              <div className="inv-col-label">Package</div>
              <div className="inv-col-sub">{sel.service_type}</div>
            </div>
          )}
        </div>
      </div>

      <hr className="inv-hr" />

      <div className="inv-matter-section">
        <div className="inv-col-label">Services</div>
        {lineItems.map((item, i) => (
          <div key={i} className="inv-row-l">
            <span>{item.label}</span>
            {item.amount > 0 && <span>{formatCurrency(item.amount)}</span>}
          </div>
        ))}
      </div>

      <div className="inv-total-l">
        <span>Estimated Total</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(198,165,90,0.08)", borderLeft: "2px solid #c6a55a", borderRadius: 2 }}>
        <div className="inv-col-label" style={{ marginBottom: 4 }}>Retainer Due to Commence</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#2a2520" }}>{formatCurrency(retainer)}</div>
        <div className="inv-col-sub" style={{ marginTop: 4 }}>Remaining {formatCurrency(subtotal - retainer)} due prior to release</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="inv-col-label" style={{ marginBottom: 6 }}>Payment Methods</div>
        {PAYMENT_METHODS.map((m) => (
          <div key={m.label} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#c6a55a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#f9f6f0", fontWeight: 700, flexShrink: 0 }}>
              {m.icon}
            </div>
            <span style={{ fontSize: 10.5, color: "#5a4a3a" }}><strong>{m.label}:</strong> {m.value}{m.note ? <span style={{ color: "#8a7a6a", fontStyle: "italic" }}> · {m.note}</span> : null}</span>
          </div>
        ))}
      </div>

      <div className="inv-footer-note">
        This is a preliminary estimate — not a binding agreement. Final invoice issued upon matter completion.
        <br />Performed in compliance with applicable Florida notarial law · FL Notary #668288
      </div>
    </div>
  );
}

function FinalInv({ sel, subtotal, retainer, balance }: InvCardProps) {
  return (
    <div className="inv-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="inv-brand">The Milano Seal™</div>
          <div className="inv-tag">Sealing Trust with Every Signature</div>
        </div>
        <MedallionStamp />
      </div>

      <InvSeals />
      <hr className="inv-hr" />
      <div className="inv-title">Final Invoice</div>
      <div className="inv-subtitle">Balance Due Before Release</div>

      <div className="inv-cols">
        <div className="inv-col-bill">
          <div className="inv-col-label">Bill To</div>
          <div className="inv-col-name">{sel.client_name ?? "—"}</div>
          {sel.email && <div className="inv-col-sub">{sel.email}</div>}
          {(sel.destination_country ?? sel.country) && (
            <div className="inv-col-sub">{sel.destination_country ?? sel.country}</div>
          )}
        </div>
        <div>
          <div className="inv-col-label">Invoice</div>
          <div className="inv-col-sub">#{sel.id.slice(0, 8).toUpperCase()}</div>
          <div className="inv-col-sub">
            {sel.created_at ? new Date(sel.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
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
        {sel.apostille_required && (
          <div className="inv-row-l">
            <span>Apostille Processing</span>
            <span>included</span>
          </div>
        )}
        {sel.translation && (
          <div className="inv-row-l">
            <span>Certified Translation</span>
            <span>included</span>
          </div>
        )}
      </div>

      <div className="inv-row-l" style={{ borderBottom: "none" }}>
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="inv-row-l">
        <span>Retainer Received</span>
        <span style={{ color: "#4a8e6b" }}>−{formatCurrency(retainer)}</span>
      </div>
      <div className="inv-total-l">
        <span>Balance Due</span>
        <span>{formatCurrency(balance)}</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="inv-col-label" style={{ marginBottom: 6 }}>Payment Methods</div>
        {PAYMENT_METHODS.map((m) => (
          <div key={m.label} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#c6a55a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#f9f6f0", fontWeight: 700, flexShrink: 0 }}>
              {m.icon}
            </div>
            <span style={{ fontSize: 10.5, color: "#5a4a3a" }}><strong>{m.label}:</strong> {m.value}{m.note ? <span style={{ color: "#8a7a6a", fontStyle: "italic" }}> · {m.note}</span> : null}</span>
          </div>
        ))}
      </div>

      <div className="inv-footer-note">
        Documents will be released upon receipt of balance in full.
        <br />Performed in compliance with applicable Florida notarial law · FL Notary #668288
      </div>
    </div>
  );
}

function PaidDoc({ sel, subtotal }: Pick<InvCardProps, "sel" | "subtotal">) {
  return (
    <div className="inv-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="inv-brand">The Milano Seal™</div>
          <div className="inv-tag">Sealing Trust with Every Signature</div>
        </div>
        <MedallionStamp check />
      </div>

      <InvSeals />
      <hr className="inv-hr" />
      <div className="inv-title">Paid & Released</div>
      <div className="inv-subtitle" style={{ color: "#4a8e6b" }}>Matter Closed · Documents Released</div>

      <div className="inv-cols">
        <div className="inv-col-bill">
          <div className="inv-col-label">Client</div>
          <div className="inv-col-name">{sel.client_name ?? "—"}</div>
          {sel.email && <div className="inv-col-sub">{sel.email}</div>}
          {(sel.destination_country ?? sel.country) && (
            <div className="inv-col-sub">{sel.destination_country ?? sel.country}</div>
          )}
        </div>
        <div>
          <div className="inv-col-label">Reference</div>
          <div className="inv-col-sub">#{sel.id.slice(0, 8).toUpperCase()}</div>
          <div className="inv-col-sub">
            {sel.created_at ? new Date(sel.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
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
        {sel.apostille_required && (
          <div className="inv-row-l"><span>Apostille Processing</span><span>included</span></div>
        )}
        {sel.translation && (
          <div className="inv-row-l"><span>Certified Translation</span><span>included</span></div>
        )}
      </div>

      <div className="inv-total-l">
        <span>Total Received</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(74,142,107,0.1)", border: "1px solid rgba(74,142,107,0.4)", borderRadius: 3, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "#4a8e6b" }}>PAID IN FULL</div>
        <div style={{ fontSize: 9, color: "#6b9e80", marginTop: 3, letterSpacing: ".1em" }}>Matter closed · Documents released</div>
      </div>

      <div className="inv-footer-note" style={{ marginTop: 18 }}>
        Thank you for trusting The Milano Seal™ with your international document execution.
        <br />Performed in compliance with applicable Florida notarial law · FL Notary #668288
      </div>
    </div>
  );
}

export default function InvoiceStudio() {
  const { data: deals } = useApi<Deal[]>("/api/deals");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [type, setType] = useState<InvType>("proforma");
  const [search, setSearch] = useState("");
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedId && deals && deals.length > 0) {
      setSelectedId(deals[0].id);
    }
  }, [deals, selectedId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (deals ?? []).filter(
      (d) =>
        !q ||
        (d.client_name ?? "").toLowerCase().includes(q) ||
        (d.destination_country ?? "").toLowerCase().includes(q) ||
        (d.document_type ?? "").toLowerCase().includes(q)
    );
  }, [deals, search]);

  const sel = useMemo(
    () => (deals ?? []).find((d) => d.id === selectedId) ?? null,
    [deals, selectedId]
  );

  const retainer = Number(sel?.invoice_retainer ?? 0);
  const subtotal = Number(
    sel?.invoice_subtotal ||
      sel?.amount ||
      (retainer > 0 ? Math.round(retainer * 2 * 100) / 100 : 0)
  );
  const balance = Number(sel?.invoice_balance ?? subtotal - retainer);

  const print = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=860,height=1120");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Invoice — The Milano Seal™</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:letter portrait;margin:.55in .65in}
  html,body{background:#f9f6f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'Cormorant Garamond',Georgia,serif;color:#2a2520}
  .inv-card{background:#f9f6f0;color:#2a2520;padding:36px 44px;font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;position:relative;min-height:600px}
  .inv-brand{font-family:'Playfair Display',Georgia,serif;font-size:11px;color:#c6a55a;letter-spacing:.16em;text-transform:uppercase}
  .inv-tag{font-size:8px;letter-spacing:.28em;text-transform:uppercase;color:#a8894a;margin-top:2px}
  .inv-hr{border:none;border-top:.75px solid #d4c9b0;margin:12px 0}
  .inv-title{text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:600;margin-bottom:4px}
  .inv-subtitle{text-align:center;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#a8894a;margin-bottom:14px}
  .inv-cols{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;margin-bottom:14px}
  .inv-col-bill{border-right:.75px solid #d4c9b0;padding-right:14px}
  .inv-col-label{font-size:7px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#a8894a;margin-bottom:5px}
  .inv-col-name{font-size:13px;font-weight:500}
  .inv-col-sub{font-size:10.5px;color:#777;line-height:1.5}
  .inv-matter-section{margin:8px 0}
  .inv-row-l{display:flex;justify-content:space-between;border-bottom:.75px solid #d4c9b0;padding:6px 0;font-size:12.5px}
  .inv-total-l{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:700;border-top:1.5px solid #c6a55a;margin-top:6px}
  .inv-paid-status{color:#4a8e6b}
  .inv-footer-note{margin-top:22px;text-align:center;font-size:7px;color:#9a8f7a;letter-spacing:.14em;text-transform:uppercase;line-height:1.7}
  .inv-seals{display:flex;justify-content:center;gap:8px;margin:10px 0 14px}
  .inv-seal-tag{border:.75px solid #c6a55a;border-radius:2px;padding:2px 7px;font-size:6px;letter-spacing:.22em;color:#c6a55a;text-transform:uppercase}
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
      <Reveal>
        <DashboardPageHeader
          eyebrow="Invoice Command Center"
          title="Invoice Studio"
          description="Generate and review matter invoices — Wise reference, deposit and final balance, discounts, and release-gate impact. Payment status is never set from the UI; it follows confirmed Wise settlement."
        />
      </Reveal>

      <div className="inv-grid">
        {/* Matter list */}
        <div className="inv-list">
          <div className="inv-list-header">
            <span>Matters</span>
            <span style={{ fontSize: 10, color: "rgba(212,175,55,0.5)", fontWeight: 400 }}>
              {filtered.length} of {(deals ?? []).length}
            </span>
          </div>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <input
              type="text"
              placeholder="Search matters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inv-search"
            />
          </div>
          {filtered.map((d) => (
            <div
              key={d.id}
              className="inv-list-item"
              data-active={selectedId === d.id}
              onClick={() => setSelectedId(d.id)}
            >
              <div className="inv-list-id">{d.id.slice(0, 8).toUpperCase()}</div>
              <div className="inv-list-name">{d.client_name ?? "—"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <div style={{ fontSize: 9, color: "rgba(212,175,55,0.4)", textTransform: "uppercase", letterSpacing: ".1em" }}>
                  {d.destination_country ?? d.country ?? ""}
                </div>
                <div className="inv-list-amt">
                  {formatCurrency(
                    Number(d.invoice_subtotal) ||
                      Number(d.amount) ||
                      (Number(d.invoice_retainer) > 0
                        ? Math.round(Number(d.invoice_retainer) * 2 * 100) / 100
                        : 0)
                  )}
                </div>
              </div>
              {d.payment_status && (
                <div style={{ marginTop: 2 }}>
                  <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 2, background: d.payment_status === "paid" ? "rgba(74,142,107,0.15)" : "rgba(212,175,55,0.08)", color: d.payment_status === "paid" ? "#4a8e6b" : "rgba(212,175,55,0.6)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                    {d.payment_status}
                  </span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="inv-list-empty">No matters found.</div>
          )}
        </div>

        {/* Invoice preview */}
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
            <div className="inv-empty">Select a matter to preview an invoice.</div>
          ) : (
            <div className="inv-paper">
              <div ref={printRef}>
                {type === "proforma" && (
                  <ProForma sel={sel} subtotal={subtotal} retainer={retainer} />
                )}
                {type === "final" && (
                  <FinalInv sel={sel} type={type} subtotal={subtotal} retainer={retainer} balance={balance} />
                )}
                {type === "paid" && (
                  <PaidDoc sel={sel} subtotal={subtotal} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .inv-eyebrow {
          font-size: 9px;
          font-family: monospace;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.5);
          margin-bottom: 4px;
        }
        .inv-h1 {
          font-family: Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          color: #fff;
          margin-bottom: 20px;
        }
        .inv-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 18px;
          align-items: start;
        }
        .inv-list {
          background: rgba(8,5,1,0.97);
          border: 1px solid rgba(212,175,55,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .inv-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          font-size: 9px;
          font-family: monospace;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.5);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .inv-search {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 2px;
          padding: 5px 8px;
          font-size: 11px;
          color: #e8e0d0;
          outline: none;
        }
        .inv-search::placeholder { color: rgba(255,255,255,0.2); }
        .inv-list-item {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: background .12s;
        }
        .inv-list-item:hover, .inv-list-item[data-active=true] {
          background: rgba(212,175,55,0.06);
        }
        .inv-list-id {
          font-size: 8.5px;
          font-family: monospace;
          color: rgba(212,175,55,0.4);
          letter-spacing: .08em;
        }
        .inv-list-name {
          font-size: 12px;
          color: #e8e0d0;
          font-weight: 500;
          margin-top: 1px;
        }
        .inv-list-amt {
          font-size: 11px;
          color: rgba(212,175,55,0.7);
          font-family: monospace;
        }
        .inv-list-empty {
          padding: 20px 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          text-align: center;
        }
        .inv-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 10px;
        }
        .inv-tabs {
          display: flex;
          gap: 4px;
          background: rgba(8,5,1,0.97);
          border: 1px solid rgba(212,175,55,0.1);
          border-radius: 2px;
          padding: 3px;
        }
        .inv-tab {
          padding: 5px 12px;
          font-size: 10px;
          letter-spacing: .08em;
          border: none;
          background: transparent;
          color: rgba(212,175,55,0.5);
          cursor: pointer;
          border-radius: 1px;
          transition: all .12s;
        }
        .inv-tab[data-active=true] {
          background: rgba(212,175,55,0.12);
          color: #c6a55a;
        }
        .inv-print-btn {
          padding: 7px 16px;
          font-size: 10px;
          letter-spacing: .12em;
          text-transform: uppercase;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.3);
          color: #c6a55a;
          border-radius: 2px;
          cursor: pointer;
          transition: all .14s;
          white-space: nowrap;
        }
        .inv-print-btn:hover:not(:disabled) {
          background: rgba(212,175,55,0.18);
        }
        .inv-print-btn:disabled {
          opacity: .35;
          cursor: default;
        }
        .inv-empty {
          padding: 40px 20px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
        }
        .inv-paper {
          background: #f9f6f0;
          border-radius: 2px;
          padding: 0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          min-height: 580px;
        }
        /* Invoice card (light background) */
        .inv-card {
          background: #f9f6f0;
          color: #2a2520;
          padding: 36px 44px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 12px;
          position: relative;
          min-height: 580px;
        }
        .inv-brand {
          font-family: Georgia, serif;
          font-size: 11px;
          color: #c6a55a;
          letter-spacing: .16em;
          text-transform: uppercase;
        }
        .inv-tag {
          font-size: 8px;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: #a8894a;
          margin-top: 2px;
        }
        .inv-hr {
          border: none;
          border-top: .75px solid #d4c9b0;
          margin: 12px 0;
        }
        .inv-title {
          text-align: center;
          font-family: Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #2a2520;
        }
        .inv-subtitle {
          text-align: center;
          font-size: 8.5px;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: #a8894a;
          margin-bottom: 14px;
        }
        .inv-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 18px;
          margin-bottom: 14px;
        }
        .inv-col-bill {
          border-right: .75px solid #d4c9b0;
          padding-right: 14px;
        }
        .inv-col-label {
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: #a8894a;
          margin-bottom: 5px;
        }
        .inv-col-name {
          font-size: 13px;
          font-weight: 500;
          color: #2a2520;
        }
        .inv-col-sub {
          font-size: 10.5px;
          color: #777;
          line-height: 1.6;
        }
        .inv-matter-section {
          margin: 8px 0;
        }
        .inv-row-l {
          display: flex;
          justify-content: space-between;
          border-bottom: .75px solid #d4c9b0;
          padding: 6px 0;
          font-size: 12.5px;
          color: #2a2520;
        }
        .inv-total-l {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          font-weight: 700;
          border-top: 1.5px solid #c6a55a;
          margin-top: 6px;
          color: #2a2520;
        }
        .inv-footer-note {
          margin-top: 22px;
          text-align: center;
          font-size: 7px;
          color: #9a8f7a;
          letter-spacing: .14em;
          text-transform: uppercase;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
