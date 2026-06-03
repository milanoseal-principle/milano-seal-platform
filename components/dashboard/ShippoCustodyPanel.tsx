"use client";

import Link from "next/link";
import ShippoCourierMotionRail from "@/components/shipping/ShippoCourierMotionRail";
import ShippoStatusBadge from "@/components/shipping/ShippoStatusBadge";
import type { MilanoCourierStatus } from "@/lib/shippo/types";

interface ShippoCustodyPanelProps {
  matterId: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  courierStatus?: string | null;
  labelCreatedAt?: string | null;
  deliveredAt?: string | null;
}

const GOLD = "#C6A55A";

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShippoCustodyPanel({
  matterId,
  carrier,
  trackingNumber,
  trackingUrl,
  courierStatus,
  labelCreatedAt,
  deliveredAt,
}: ShippoCustodyPanelProps) {
  const rawStatus = (courierStatus?.toUpperCase() ?? "UNKNOWN") as MilanoCourierStatus;
  const isException = rawStatus === "EXCEPTION" || rawStatus === "RETURNED";

  return (
    <div
      style={{
        background: "#0c0c0c",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 4,
        padding: "20px 24px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 14,
        }}
      >
        Courier Custody
      </div>

      <div style={{ marginBottom: 14 }}>
        <ShippoCourierMotionRail
          status={rawStatus}
          carrier={carrier}
          trackingNumberDisplay={trackingNumber}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <ShippoStatusBadge status={rawStatus} size="sm" />
      </div>

      {isException && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 4,
            background: "rgba(184,92,92,0.07)",
            border: "1px solid rgba(184,92,92,0.22)",
            marginBottom: 14,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "#B85C5C", lineHeight: 1.5 }}>
            {rawStatus === "RETURNED"
              ? "Shipment returned to sender. Operator action required."
              : "Courier exception flagged. Review required before re-dispatch."}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 20px",
          marginBottom: 16,
        }}
      >
        {carrier && (
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 2,
              }}
            >
              Carrier
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
              {carrier}
            </div>
          </div>
        )}
        {trackingNumber && (
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 2,
              }}
            >
              Tracking
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
              {trackingNumber}
            </div>
          </div>
        )}
        {labelCreatedAt && (
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 2,
              }}
            >
              Label Created
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              {fmt(labelCreatedAt)}
            </div>
          </div>
        )}
        {deliveredAt && (
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 2,
              }}
            >
              Delivered
            </div>
            <div style={{ fontSize: 12, color: "#3FA47A" }}>
              {fmt(deliveredAt)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          href="/dashboard/shipping"
          style={{
            fontSize: 11,
            padding: "7px 14px",
            borderRadius: 3,
            background: "rgba(198,165,90,0.08)",
            border: "1px solid rgba(198,165,90,0.25)",
            color: GOLD,
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          Open Shipping Center
        </Link>
        <Link
          href={`/dashboard/releases?matter_id=${matterId}`}
          style={{
            fontSize: 11,
            padding: "7px 14px",
            borderRadius: 3,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          Release Review
        </Link>
      </div>
    </div>
  );
}
