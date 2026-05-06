"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/components/portal/portal-context";

interface TrackingResponse {
  tracking: null | {
    carrier: string;
    tracking_number: string;
    delivery_status: string | null;
    delivery_eta: string | null;
    delivery_timestamp: string | null;
    signed_by: string | null;
    label_url: string | null;
    ship_to: Record<string, unknown> | null;
    evidence_url?: string | null;
    evidence_generated_at?: string | null;
    live: {
      tracking_status?: {
        status?: string;
        status_details?: string;
        location?: { city?: string; state?: string; country?: string };
        status_date?: string;
      };
      eta?: string;
    } | null;
  };
}

const STATUS_LABEL: Record<string, string> = {
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Delivery Issue",
  unknown: "Unknown",
};

const STATUS_COLOR: Record<string, string> = {
  in_transit: "#9b7ed4",
  out_for_delivery: "#c8973a",
  delivered: "#4a9e6b",
  failed: "#c05050",
  unknown: "#888",
};

export default function ClientTrackingPage() {
  const { deal, isLoading: dealLoading } = usePortal();
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deal) return;
    void (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/portal/me/tracking?deal_id=${deal.id}`, {
          cache: "no-store",
        });
        if (r.ok) setData((await r.json()) as TrackingResponse);
      } finally {
        setLoading(false);
      }
    })();
  }, [deal]);

  if (dealLoading || loading) {
    return <div style={{ color: "rgba(255,255,255,.4)" }}>Loading tracking…</div>;
  }
  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  const t = data?.tracking;

  return (
    <div>
      <div className="ct-eyebrow">Shipment Tracking</div>
      <h1 className="ct-h1">Carrier &amp; Delivery</h1>

      {!t ? (
        <div className="ct-empty">
          <div className="ct-empty-h">Not yet shipped</div>
          <div className="ct-empty-p">
            We&rsquo;ll show carrier, tracking number, and live delivery updates
            here once your matter is dispatched.
          </div>
        </div>
      ) : (
        <>
          <div className="ct-card">
            <div className="ct-card-h">Shipment Summary</div>

            <div className="ct-kv">
              <span className="ct-kv-k">Carrier</span>
              <span className="ct-kv-v">{t.carrier.toUpperCase()}</span>
            </div>
            <div className="ct-kv">
              <span className="ct-kv-k">Tracking #</span>
              <span className="ct-kv-v ct-kv-v mono">
                {t.tracking_number}
              </span>
            </div>
            <div className="ct-kv">
              <span className="ct-kv-k">Status</span>
              <span
                className="ct-status-pill"
                style={{
                  color: STATUS_COLOR[t.delivery_status ?? "unknown"],
                  borderColor: STATUS_COLOR[t.delivery_status ?? "unknown"],
                }}
              >
                {STATUS_LABEL[t.delivery_status ?? "unknown"] ?? "—"}
              </span>
            </div>
            {t.delivery_eta && (
              <div className="ct-kv">
                <span className="ct-kv-k">Estimated Delivery</span>
                <span className="ct-kv-v">
                  {new Date(t.delivery_eta).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {t.signed_by && (
              <div className="ct-kv">
                <span className="ct-kv-k">Signed By</span>
                <span className="ct-kv-v">{t.signed_by}</span>
              </div>
            )}
            {t.delivery_timestamp && (
              <div className="ct-kv">
                <span className="ct-kv-k">Delivered At</span>
                <span className="ct-kv-v">
                  {new Date(t.delivery_timestamp).toLocaleString()}
                </span>
              </div>
            )}
            {t.live?.tracking_status?.location?.city && (
              <div className="ct-kv">
                <span className="ct-kv-k">Last Location</span>
                <span className="ct-kv-v">
                  {t.live.tracking_status.location.city}
                  {t.live.tracking_status.location.state
                    ? `, ${t.live.tracking_status.location.state}`
                    : ""}
                </span>
              </div>
            )}
            {t.live?.tracking_status?.status_details && (
              <div className="ct-kv">
                <span className="ct-kv-k">Latest Update</span>
                <span className="ct-kv-v ct-kv-v light">
                  {t.live.tracking_status.status_details}
                </span>
              </div>
            )}
          </div>

          {t.delivery_status === "delivered" && (
            <div className="ct-card">
              <div className="ct-card-h">Delivery Proof</div>
              <p className="ct-proof-desc">
                Your matter is closed. We&rsquo;ve generated a court-ready
                evidence packet that captures the entire chain of custody — from
                intake to signature — with a tamper-evident hash chain.
              </p>
              <a
                href={t.evidence_url ?? `/api/evidence/${deal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ct-link ct-link-btn"
              >
                Download Evidence Packet (PDF)
              </a>
            </div>
          )}

          {t.label_url && (
            <div className="ct-label-link">
              Shipping label:{" "}
              <a
                href={t.label_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ct-link"
              >
                view PDF
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
