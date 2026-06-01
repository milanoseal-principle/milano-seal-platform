export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DealRow {
  client_name: string | null;
  email: string | null;
  company_name: string | null;
  referral_source: string | null;
  total_price: number | null;
  payment_status: string | null;
  created_at: string | null;
  destination_country: string | null;
}

interface ContactRecord {
  name: string;
  email: string;
  type: "Attorney" | "Corporate" | "Referral Partner" | "Individual";
  totalMatters: number;
  totalSpend: number;
  lastActivity: string;
  primaryDestination: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferType(
  referral_source: string | null,
  company_name: string | null,
): ContactRecord["type"] {
  const ref = (referral_source ?? "").toLowerCase();
  if (ref.includes("attorney") || ref.includes("law")) return "Attorney";
  if (referral_source && referral_source.trim().length > 0) return "Referral Partner";
  if (company_name && company_name.trim().length > 0) return "Corporate";
  return "Individual";
}

function mostCommon(arr: string[]): string {
  if (!arr.length) return "—";
  const freq: Record<string, number> = {};
  for (const v of arr) freq[v] = (freq[v] ?? 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Data fetch ────────────────────────────────────────────────────────────────

async function getRelationshipsData() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("deals")
      .select(
        "client_name, email, company_name, referral_source, total_price, payment_status, created_at, destination_country",
      )
      .order("created_at", { ascending: false });

    if (error || !data) return { contacts: [], chips: getEmptyChips() };

    const deals: DealRow[] = data;

    // Build contact map keyed by email (fallback to client_name)
    const emailMap = new Map<string, DealRow[]>();
    for (const d of deals) {
      const key = (d.email ?? d.client_name ?? "unknown").toLowerCase().trim();
      if (!emailMap.has(key)) emailMap.set(key, []);
      emailMap.get(key)!.push(d);
    }

    const contacts: ContactRecord[] = [];
    for (const [, rows] of emailMap) {
      const ref = rows[0];
      const type = inferType(ref.referral_source, ref.company_name);
      const totalSpend = rows
        .filter((r) => r.payment_status === "paid")
        .reduce((s, r) => s + (Number(r.total_price) || 0), 0);
      const destinations = rows
        .map((r) => r.destination_country)
        .filter(Boolean) as string[];
      contacts.push({
        name: ref.client_name ?? "Unknown",
        email: ref.email ?? "—",
        type,
        totalMatters: rows.length,
        totalSpend,
        lastActivity: rows[0].created_at ?? "",
        primaryDestination: mostCommon(destinations),
      });
    }

    contacts.sort((a, b) => b.totalSpend - a.totalSpend);

    // Summary chips
    const uniqueEmails = new Set(
      deals.map((d) => (d.email ?? d.client_name ?? "").toLowerCase().trim()),
    ).size;

    const attorneys = deals.filter((d) => {
      const r = (d.referral_source ?? "").toLowerCase();
      return r.includes("attorney") || r.includes("law");
    }).length;

    const referralPartners = deals.filter((d) => {
      const r = (d.referral_source ?? "").toLowerCase();
      return (
        d.referral_source &&
        d.referral_source.trim().length > 0 &&
        !r.includes("attorney") &&
        !r.includes("law")
      );
    }).length;

    const corporate = deals.filter(
      (d) => d.company_name && d.company_name.trim().length > 0,
    ).length;

    const individual = deals.length - attorneys - referralPartners - corporate;

    return {
      contacts,
      chips: { clients: uniqueEmails, attorneys, referralPartners, corporate, individual },
    };
  } catch {
    return { contacts: [], chips: getEmptyChips() };
  }
}

function getEmptyChips() {
  return { clients: 0, attorneys: 0, referralPartners: 0, corporate: 0, individual: 0 };
}

// ── Static reference data ─────────────────────────────────────────────────────

const RELATIONSHIP_TYPES = [
  {
    tag: "CLIENT",
    title: "Client",
    description:
      "Direct service recipient. Primary revenue source. Tracked via email and matter history.",
  },
  {
    tag: "ATTORNEY",
    title: "Attorney",
    description:
      "Refers estate, immigration, and adoption matters. High LTV referral pathway.",
  },
  {
    tag: "TRANSLATOR",
    title: "Translator",
    description:
      "Coordinate for translation-required matters. Operator-managed. Not tracked in client CRM.",
  },
  {
    tag: "GENEALOGIST",
    title: "Genealogist",
    description:
      "Refers citizenship and ancestry document matters. Niche high-value referral segment.",
  },
  {
    tag: "COURIER",
    title: "Courier",
    description:
      "Delivery execution partner. Tracked via Shippo. Not a referral source.",
  },
  {
    tag: "ALLIANCE",
    title: "Alliance Partner",
    description:
      "International notary and apostille network member. Tracked in alliance dashboard.",
  },
  {
    tag: "GOVT",
    title: "Government Contact",
    description:
      "Authority liaison for apostille, consular, and civil registry matters. Tracked in AOC.",
  },
  {
    tag: "CORPORATE",
    title: "Corporate Client",
    description:
      "Company with recurring document needs. Identified via company_name field in matters.",
  },
];

const TYPE_BADGE_COLORS: Record<ContactRecord["type"], string> = {
  Attorney: "rgba(198,165,90,0.15)",
  Corporate: "rgba(99,102,241,0.15)",
  "Referral Partner": "rgba(34,197,94,0.15)",
  Individual: "rgba(148,163,184,0.12)",
};

const TYPE_TEXT_COLORS: Record<ContactRecord["type"], string> = {
  Attorney: "#C6A55A",
  Corporate: "#818CF8",
  "Referral Partner": "#4ADE80",
  Individual: "#94A3B8",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default async function RelationshipsPage() {
  await requireDashboardAccess();
  const { contacts, chips } = await getRelationshipsData();

  return (
    <div
      className="min-h-screen px-6 py-8 space-y-10"
      style={{ background: "#0A0A0A" }}
    >
      {/* Header */}
      <div>
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-2"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Platform Memory
        </p>
        <h1 className="font-serif text-3xl text-white">Relationship Graph</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          High-trust ecosystem registry. Inferred from matter data. Updated on each new deal.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total Contacts", value: chips.clients },
          { label: "Attorneys", value: chips.attorneys },
          { label: "Referral Partners", value: chips.referralPartners },
          { label: "Corporate", value: chips.corporate },
          { label: "Individual", value: chips.individual },
        ].map((chip) => (
          <div
            key={chip.label}
            className="flex items-center gap-2 px-4 py-2 rounded-sm"
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.08)",
            }}
          >
            <span
              className="font-mono text-lg font-light"
              style={{ color: "#C6A55A" }}
            >
              {chip.value}
            </span>
            <span
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      {/* Relationship Registry Table */}
      <div>
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Relationship Registry
        </p>
        <div
          className="rounded-sm overflow-hidden"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                  {[
                    "Name",
                    "Email",
                    "Type",
                    "Total Matters",
                    "Total Spend",
                    "Last Activity",
                    "Primary Destination",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase"
                      style={{ color: "rgba(198,165,90,0.5)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      No contact data available.
                    </td>
                  </tr>
                ) : (
                  contacts.map((c, i) => (
                    <tr
                      key={`${c.email}-${i}`}
                      style={{
                        borderBottom: "1px solid rgba(212,175,55,0.04)",
                      }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        {c.name}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-[11px]"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {c.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm"
                          style={{
                            background: TYPE_BADGE_COLORS[c.type],
                            color: TYPE_TEXT_COLORS[c.type],
                          }}
                        >
                          {c.type}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-center"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {c.totalMatters}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: c.totalSpend > 0 ? "#C6A55A" : "rgba(255,255,255,0.35)" }}
                      >
                        {c.totalSpend > 0 ? fmtCurrency(c.totalSpend) : "—"}
                      </td>
                      <td
                        className="px-4 py-3 text-[12px]"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {fmtDate(c.lastActivity)}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-[11px]"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {c.primaryDestination}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Relationship Category Reference */}
      <div>
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Relationship Type Reference
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {RELATIONSHIP_TYPES.map((rt) => (
            <div
              key={rt.tag}
              className="px-4 py-4 rounded-sm space-y-2"
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm" style={{ color: "#C6A55A" }}>
                  {rt.title}
                </span>
                <span
                  className="font-mono text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm"
                  style={{
                    background: "rgba(198,165,90,0.1)",
                    color: "rgba(198,165,90,0.6)",
                  }}
                >
                  {rt.tag}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {rt.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship note */}
      <div
        className="px-4 py-3 rounded-sm"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.06)",
        }}
      >
        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
          Relationship types are inferred from referral source and company fields. Update individual
          contact types in the matter detail view. No relationship data is shared with clients or
          partners.
        </p>
      </div>
    </div>
  );
}
