"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ReleaseRow {
  id: string;
  deal_id: string;
  client_name: string;
  destination_country: string;
  document_type: string;
  matter_status: string;
  canonical_state: string | null;
  raw_state: string | null;
  alias_applied: boolean;
  updated_at: string;
  days_in_state: number;
  payment_status: string;
  payment_confirmed: boolean;
  tracking_number: string | null;
  carrier: string | null;
  delivery_status: string | null;
}

interface ReleaseData {
  ready_for_release: ReleaseRow[];
  waiting_approval: ReleaseRow[];
  waiting_courier: ReleaseRow[];
  waiting_verification: ReleaseRow[];
  completed: ReleaseRow[];
  unresolved?: ReleaseRow[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  Italy: "🇮🇹",
  Portugal: "🇵🇹",
  Mexico: "🇲🇽",
  Spain: "🇪🇸",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Colombia: "🇨🇴",
  Peru: "🇵🇪",
  Chile: "🇨🇱",
  Japan: "🇯🇵",
  China: "🇨🇳",
  UAE: "🇦🇪",
  UK: "🇬🇧",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Netherlands: "🇳🇱",
};

const QUEUE_CONFIG = [
  { key: "ready_for_release", label: "Ready for Release", color: "#C6A55A" },
  { key: "waiting_approval", label: "Waiting Approval", color: "#f59e0b" },
  { key: "waiting_courier", label: "Waiting Courier", color: "#f59e0b" },
  { key: "waiting_verification", label: "In Transit", color: "#4a9e6b" },
  { key: "completed", label: "Completed", color: "#4a9e6b" },
] as const;

function MatterCard({
  row,
  showReviewAction,
  focused,
}: {
  row: ReleaseRow;
  showReviewAction?: boolean;
  focused?: boolean;
}) {
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flag = COUNTRY_FLAGS[row.destination_country] ?? "🌍";

  async function markForReview() {
    setMarking(true);
    setError(null);
    const response = await fetch(`/api/deals/${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "[release-review-requested]" }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not request release review.");
      setMarking(false);
      return;
    }

    setMarked(true);
    setMarking(false);
  }

  return (
    <div
      style={{
        background: focused ? "rgba(198,165,90,0.07)" : "rgba(255,255,255,0.02)",
        border: focused
          ? "1px solid rgba(198,165,90,0.45)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "10px 12px",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <Link
            href={`/dashboard/deals/${encodeURIComponent(row.id)}`}
            style={{
              display: "block",
              fontSize: 10,
              color: "#C6A55A",
              fontFamily: "monospace",
              textDecoration: "none",
              marginBottom: 3,
            }}
          >
            {row.deal_id}
          </Link>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>
            {flag} {row.destination_country}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
            {row.client_name} · {row.document_type}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: 700,
              color:
                row.days_in_state >= 7
                  ? "#ef4444"
                  : row.days_in_state >= 3
                    ? "#f59e0b"
                    : "rgba(255,255,255,0.5)",
            }}
          >
            {row.days_in_state}d
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            {row.matter_status?.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {row.alias_applied ? (
        <div style={{ marginTop: 6, fontSize: 8, color: "rgba(245,158,11,0.65)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
          LEGACY STATE PROJECTED · READ ONLY
        </div>
      ) : null}

      {showReviewAction && (
        <button
          onClick={() => void markForReview()}
          disabled={marking || marked}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "6px 0",
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: marked ? "rgba(198,165,90,0.4)" : "#C6A55A",
            background: marked ? "rgba(198,165,90,0.04)" : "rgba(198,165,90,0.08)",
            border: `1px solid ${marked ? "rgba(198,165,90,0.15)" : "rgba(198,165,90,0.3)"}`,
            borderRadius: 2,
            cursor: marking || marked ? "default" : "pointer",
          }}
        >
          {marked ? "Review Requested" : marking ? "Requesting..." : "Request Release Review"}
        </button>
      )}

      {error ? (
        <p style={{ marginTop: 6, fontSize: 9, color: "#c05050", fontFamily: "monospace" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function QueueColumn({
  label,
  color,
  rows,
  showReviewAction,
  focusMatter,
}: {
  label: string;
  color: string;
  rows: ReleaseRow[];
  showReviewAction?: boolean;
  focusMatter: string | null;
}) {
  return (
    <div
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: 16,
        flex: 1,
        minWidth: 220,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)" }}>
          {label}
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: 700,
            color,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            borderRadius: 2,
            padding: "1px 7px",
          }}
        >
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Empty</div>
      ) : (
        rows.slice(0, 30).map((row) => (
          <MatterCard
            key={row.id}
            row={row}
            showReviewAction={showReviewAction}
            focused={focusMatter === row.id || focusMatter === row.deal_id}
          />
        ))
      )}
    </div>
  );
}

interface DeliveredNotReleasedRow {
  matter_id: string;
  client_name: string;
  country: string;
  document_type: string;
  carrier: string;
  tracking_number_display: string;
  delivered_at: string | null;
  certificate_status: string;
}

function DeliveredNotReleasedSection() {
  const [rows, setRows] = useState<DeliveredNotReleasedRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/shippo/delivered-not-released")
      .then((response) => response.json() as Promise<{ shipments: DeliveredNotReleasedRow[]; notice?: string }>)
      .then((data) => {
        setRows(data.shipments ?? []);
        setNotice(data.notice ?? null);
      })
      .catch(() => setNotice("Unable to load — check configuration"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        marginTop: 32,
        padding: "20px 24px",
        background: "rgba(184,92,92,0.04)",
        border: "1px solid rgba(184,92,92,0.18)",
        borderRadius: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.26em", textTransform: "uppercase", color: "#B85C5C" }}>
          Delivered · Not Released
        </div>
        {rows.length > 0 && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(184,92,92,0.12)", border: "1px solid rgba(184,92,92,0.3)", color: "#B85C5C" }}>
            {rows.length}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading…</div>
      ) : notice ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>{notice}</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No delivered-not-released matters.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row) => (
            <div
              key={row.matter_id}
              style={{
                background: "#0c0c0c",
                border: "1px solid rgba(184,92,92,0.15)",
                borderRadius: 3,
                padding: "12px 16px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 20px",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", flex: 1, minWidth: 120 }}>
                {row.client_name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                {row.document_type} · {row.country}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                {row.carrier} {row.tracking_number_display}
              </div>
              {row.delivered_at && (
                <div style={{ fontSize: 10, color: "#3FA47A" }}>
                  Delivered {new Date(row.delivered_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              )}
              <Link
                href={`/dashboard/releases?matter=${encodeURIComponent(row.matter_id)}`}
                style={{
                  fontSize: 10,
                  padding: "4px 10px",
                  borderRadius: 2,
                  background: "rgba(184,92,92,0.1)",
                  border: "1px solid rgba(184,92,92,0.25)",
                  color: "#B85C5C",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Review Release →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReleaseControlCenter() {
  const searchParams = useSearchParams();
  const focusMatter = searchParams.get("matter") ?? searchParams.get("deal");
  const [data, setData] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/releases", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message ?? body.error ?? "Release data unavailable");
        }
        return response.json() as Promise<ReleaseData>;
      })
      .then((responseData) => {
        setData(responseData);
        setLoadError(null);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Release data unavailable"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#050507", padding: "32px 24px", color: "rgba(255,255,255,0.75)" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", marginBottom: 6 }}>
          Milano Seal — Operations
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
          Release Control Center
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
          Canonical release queues. Operator-only. No automatic releases.
        </p>
      </div>

      {focusMatter ? (
        <div style={{ marginBottom: 20, padding: "10px 12px", background: "rgba(198,165,90,0.05)", border: "1px solid rgba(198,165,90,0.18)", borderRadius: 3 }}>
          <div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(198,165,90,0.55)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Focused Matter
          </div>
          <div style={{ marginTop: 4, fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", wordBreak: "break-all" }}>
            {focusMatter}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading release data...</div>
      ) : loadError ? (
        <div style={{ padding: 16, border: "1px solid rgba(192,80,80,0.25)", background: "rgba(192,80,80,0.05)", color: "#c05050", fontSize: 12 }}>
          {loadError}. This is not an empty release queue.
        </div>
      ) : data ? (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            {QUEUE_CONFIG.map(({ key, label, color }) => (
              <QueueColumn
                key={key}
                label={label}
                color={color}
                rows={data[key] ?? []}
                showReviewAction={key === "ready_for_release"}
                focusMatter={focusMatter}
              />
            ))}
          </div>

          {(data.unresolved?.length ?? 0) > 0 ? (
            <div style={{ marginTop: 20, padding: 14, border: "1px solid rgba(245,158,11,0.22)", background: "rgba(245,158,11,0.05)", borderRadius: 3 }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#f59e0b", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Unresolved State Rows · {data.unresolved?.length ?? 0}
              </div>
              <div style={{ marginTop: 5, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                These Matters are visible for review and are not silently assigned to a release queue.
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <DeliveredNotReleasedSection />
    </div>
  );
}
