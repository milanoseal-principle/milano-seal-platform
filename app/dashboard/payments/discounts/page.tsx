"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

interface DiscountCodeRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  status: "inactive" | "active" | "exhausted" | "expired" | "revoked";
  usage_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  applies_to: string;
  client_id: string | null;
  attorney_profile_id: string | null;
  matter_id: string | null;
  internal_reason: string | null;
  client_label: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface DraftState {
  code: string;
  percentage: string;
  usage_limit: string;
  starts_at: string;
  expires_at: string;
  client_id: string;
  matter_id: string;
  alliance_member_id: string;
  eligible_service_scope: string;
  internal_reason: string;
  client_label: string;
}

const EMPTY_DRAFT: DraftState = {
  code: "",
  percentage: "",
  usage_limit: "1",
  starts_at: "",
  expires_at: "",
  client_id: "",
  matter_id: "",
  alliance_member_id: "",
  eligible_service_scope: "all_eligible_services",
  internal_reason: "",
  client_label: "Milano Seal courtesy adjustment",
};

function fmtDate(value: string | null) {
  if (!value) return "No expiration";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusColor(status: DiscountCodeRow["status"]) {
  if (status === "active") return "#3FA47A";
  if (status === "revoked" || status === "expired" || status === "exhausted") return "#B85C5C";
  return "#C6A55A";
}

export default function DiscountCodeManagerPage() {
  const [codes, setCodes] = useState<DiscountCodeRow[]>([]);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadCodes() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/discounts", { cache: "no-store" });
      const body = (await response.json()) as { data?: DiscountCodeRow[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load discount codes");
      setCodes(body.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load discount codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCodes();
  }, []);

  const activeCount = useMemo(() => codes.filter((code) => code.status === "active").length, [codes]);
  const totalRedemptions = useMemo(() => codes.reduce((sum, code) => sum + Number(code.usage_count ?? 0), 0), [codes]);

  async function createCode(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const percentage = Number(draft.percentage);
      const usageLimit = draft.usage_limit.trim() ? Number(draft.usage_limit) : null;
      const response = await fetch("/api/dashboard/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: draft.code,
          discount_type: "percentage",
          discount_value: percentage,
          applies_to: "eligible_subtotal",
          usage_limit: usageLimit,
          starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
          expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : null,
          client_id: draft.client_id || null,
          matter_id: draft.matter_id || null,
          internal_reason: draft.internal_reason,
          client_label: draft.client_label,
          metadata: {
            alliance_member_id: draft.alliance_member_id || null,
            eligible_service_scope: draft.eligible_service_scope,
            stackable: false,
          },
        }),
      });
      const body = (await response.json()) as { data?: DiscountCodeRow; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to create discount code");
      setDraft(EMPTY_DRAFT);
      setNotice("Code created as inactive. Review and activate when ready.");
      await loadCodes();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create discount code");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: DiscountCodeRow["status"]) {
    setNotice(null);
    const response = await fetch("/api/dashboard/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(body.error || "Unable to update code");
      return;
    }
    await loadCodes();
  }

  return (
    <div style={{ padding: "32px 28px", background: "#050505", minHeight: "100vh", color: "#F6F1E6" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 24 }}>
        <header>
          <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.55)", marginBottom: 8 }}>
            Payments / Discount Governance
          </div>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 600 }}>
            Discount Code Manager
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(246,241,230,0.58)", maxWidth: 760, lineHeight: 1.6 }}>
            Founder/admin controlled courtesy benefits. Codes never edit Matter pricing directly, never auto-redeem, and remain subordinate to canonical pricing, Wise reconciliation, and the 50/50 invoice doctrine.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {[
            ["Active Codes", activeCount],
            ["Total Codes", codes.length],
            ["Recorded Redemptions", totalRedemptions],
            ["Pricing Authority", "Server only"],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ border: "1px solid rgba(198,165,90,0.14)", borderRadius: 12, background: "#0B0B0B", padding: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(198,165,90,0.45)" }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 22, color: "#F6F1E6" }}>{value}</div>
            </div>
          ))}
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.4fr)", gap: 18, alignItems: "start" }}>
          <form onSubmit={createCode} style={{ border: "1px solid rgba(198,165,90,0.18)", borderRadius: 14, background: "#0B0B0B", padding: 20, display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C6A55A" }}>Create governed code</div>
              <p style={{ fontSize: 11, color: "rgba(246,241,230,0.48)", lineHeight: 1.5, margin: "6px 0 0" }}>
                New codes start inactive and require explicit activation.
              </p>
            </div>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Code
              <input required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="ALLIANCE20" style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Percentage
              <input required type="number" min="1" max="100" step="0.01" value={draft.percentage} onChange={(e) => setDraft({ ...draft, percentage: e.target.value })} placeholder="20" style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Usage limit
              <input type="number" min="1" value={draft.usage_limit} onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value })} placeholder="1" style={inputStyle} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
                Starts
                <input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
                Expires
                <input type="datetime-local" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} style={inputStyle} />
              </label>
            </div>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Client ID restriction
              <input value={draft.client_id} onChange={(e) => setDraft({ ...draft, client_id: e.target.value })} placeholder="Optional UUID" style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Matter ID restriction
              <input value={draft.matter_id} onChange={(e) => setDraft({ ...draft, matter_id: e.target.value })} placeholder="Optional UUID" style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Alliance member restriction
              <input value={draft.alliance_member_id} onChange={(e) => setDraft({ ...draft, alliance_member_id: e.target.value })} placeholder="Optional member/profile ID" style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Eligible service scope
              <select value={draft.eligible_service_scope} onChange={(e) => setDraft({ ...draft, eligible_service_scope: e.target.value })} style={inputStyle}>
                <option value="all_eligible_services">All eligible services</option>
                <option value="document_execution">Document execution</option>
                <option value="notarization">Notarization</option>
                <option value="apostille_coordination">Apostille coordination</option>
                <option value="professional_services">Professional services</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Benefit label
              <input value={draft.client_label} onChange={(e) => setDraft({ ...draft, client_label: e.target.value })} style={inputStyle} />
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 11 }}>
              Internal reason
              <textarea required value={draft.internal_reason} onChange={(e) => setDraft({ ...draft, internal_reason: e.target.value })} placeholder="Why this code exists and who approved it" style={{ ...inputStyle, minHeight: 82, resize: "vertical" }} />
            </label>

            <button disabled={saving} type="submit" style={primaryButtonStyle}>
              {saving ? "Creating…" : "Create inactive code"}
            </button>
          </form>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(198,165,90,0.6)" }}>Code registry</div>
              <button onClick={() => void loadCodes()} style={secondaryButtonStyle}>Refresh</button>
            </div>

            {notice && <div style={{ border: "1px solid rgba(198,165,90,0.2)", background: "rgba(198,165,90,0.06)", borderRadius: 10, padding: 12, fontSize: 11, color: "#C6A55A" }}>{notice}</div>}

            {loading ? (
              <div style={{ padding: 30, color: "rgba(246,241,230,0.4)", fontSize: 12 }}>Loading discount governance…</div>
            ) : codes.length === 0 ? (
              <div style={{ padding: 30, border: "1px solid rgba(198,165,90,0.12)", borderRadius: 12, color: "rgba(246,241,230,0.45)", fontSize: 12 }}>No governed codes yet.</div>
            ) : (
              codes.map((code) => {
                const meta = (code.metadata ?? {}) as Record<string, unknown>;
                return (
                  <article key={code.id} style={{ border: "1px solid rgba(198,165,90,0.14)", borderRadius: 12, background: "#0B0B0B", padding: 16, display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                          <strong style={{ fontFamily: "monospace", fontSize: 16, color: "#F6F1E6" }}>{code.code}</strong>
                          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: statusColor(code.status) }}>{code.status}</span>
                        </div>
                        <div style={{ marginTop: 4, color: "#C6A55A", fontSize: 18 }}>{Number(code.discount_value)}% off eligible subtotal</div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 10, color: "rgba(246,241,230,0.45)" }}>
                        {code.usage_count}/{code.usage_limit ?? "∞"} used<br />{fmtDate(code.expires_at)}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, fontSize: 10, color: "rgba(246,241,230,0.56)" }}>
                      <div>Client: {code.client_id ?? "Any eligible"}</div>
                      <div>Matter: {code.matter_id ?? "Any eligible"}</div>
                      <div>Alliance: {String(meta.alliance_member_id ?? "Not restricted")}</div>
                      <div>Scope: {String(meta.eligible_service_scope ?? "all_eligible_services")}</div>
                    </div>

                    <div style={{ fontSize: 11, color: "rgba(246,241,230,0.54)", lineHeight: 1.5 }}>
                      {code.internal_reason || "No internal reason recorded."}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {code.status !== "active" && code.status !== "exhausted" && code.status !== "expired" && code.status !== "revoked" && (
                        <button onClick={() => void changeStatus(code.id, "active")} style={primarySmallButtonStyle}>Activate</button>
                      )}
                      {code.status === "active" && (
                        <button onClick={() => void changeStatus(code.id, "inactive")} style={secondaryButtonStyle}>Pause</button>
                      )}
                      {code.status !== "revoked" && (
                        <button onClick={() => void changeStatus(code.id, "revoked")} style={{ ...secondaryButtonStyle, color: "#B85C5C", borderColor: "rgba(184,92,92,0.28)" }}>Revoke</button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: 42,
  borderRadius: 8,
  border: "1px solid rgba(198,165,90,0.18)",
  background: "#101010",
  color: "#F6F1E6",
  padding: "9px 11px",
  outline: "none",
} as const;

const primaryButtonStyle = {
  minHeight: 44,
  borderRadius: 9,
  border: "1px solid #C6A55A",
  background: "#C6A55A",
  color: "#050505",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  cursor: "pointer",
} as const;

const primarySmallButtonStyle = {
  ...primaryButtonStyle,
  minHeight: 34,
  padding: "0 12px",
} as const;

const secondaryButtonStyle = {
  minHeight: 34,
  padding: "0 12px",
  borderRadius: 7,
  border: "1px solid rgba(198,165,90,0.18)",
  background: "transparent",
  color: "rgba(246,241,230,0.72)",
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
} as const;
