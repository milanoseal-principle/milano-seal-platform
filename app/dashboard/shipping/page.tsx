"use client";

import Link from "next/link";
import ShippoCourierMotionRail from "@/components/shipping/ShippoCourierMotionRail";

type CourierStatus =
  | "LABEL_CREATED"
  | "PRE_TRANSIT"
  | "TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION"
  | "RETURNED"
  | "UNKNOWN";

interface ShipmentRow {
  id: string;
  matter_id: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  courier_status: CourierStatus;
  label_created_at: string | null;
  delivered_at: string | null;
  exception_at: string | null;
  returned_at: string | null;
  deals?: { client_name: string | null; id: string } | null;
}

const STATUS_GROUPS: { status: CourierStatus[]; label: string; color: string }[] = [
  { status: ["LABEL_CREATED"],    label: "Ready for Transit", color: "#C6A55A" },
  { status: ["PRE_TRANSIT"],      label: "Awaiting Pickup",   color: "#C6A55A" },
  { status: ["TRANSIT"],          label: "In Transit",        color: "#3FA47A" },
  { status: ["OUT_FOR_DELIVERY"], label: "Out for Delivery",  color: "#3FA47A" },
  { status: ["DELIVERED"],        label: "Delivered",         color: "#3FA47A" },
  { status: ["EXCEPTION"],        label: "Exceptions",        color: "#B85C5C" },
  { status: ["RETURNED"],         label: "Returned",          color: "#C99A3D" },
];

function statusColor(s: CourierStatus): string {
  if (s === "EXCEPTION" || s === "RETURNED") return "#B85C5C";
  if (s === "DELIVERED" || s === "TRANSIT" || s === "OUT_FOR_DELIVERY") return "#3FA47A";
  return "#C6A55A";
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ShippingPage() {
  // Shipping data is available after migration 015 is applied and SHIPPO_API_KEY is configured.
  // The data fetch is intentionally deferred until the database migration is in place.
  const shipments: ShipmentRow[] = [];

  return (
    <div style={{ padding: "32px 28px", background: "#050505", minHeight: "100vh", color: "#f6f1e6" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", marginBottom: 6 }}>
          / SHIPPING /
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: "#f6f1e6", margin: 0 }}>
          Shipping Control Center
        </h1>
        <p style={{ fontSize: 12, color: "rgba(198,165,90,0.45)", marginTop: 6 }}>
          Real courier status only. No fake tracking. No auto-release.
        </p>
      </div>

      {/* Migration / configuration notice */}
      <div
        style={{
          padding: "14px 18px",
          background: "rgba(198,165,90,0.06)",
          border: "1px solid rgba(198,165,90,0.2)",
          borderRadius: 4,
          marginBottom: 28,
          fontSize: 12,
          color: "rgba(198,165,90,0.75)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#C6A55A", letterSpacing: "0.05em" }}>Operator Notice:</strong>{" "}
        Shipping data available after migration 015 is applied and{" "}
        <code style={{ fontFamily: "monospace", fontSize: 11 }}>SHIPPO_API_KEY</code> is configured.
      </div>

      {/* Visual example — status rail with UNKNOWN */}
      <div
        style={{
          padding: "18px 20px",
          background: "#0B0B0B",
          border: "1px solid rgba(198,165,90,0.1)",
          borderRadius: 4,
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(198,165,90,0.4)", marginBottom: 10 }}>
          Courier Status Rail — Preview
        </div>
        <ShippoCourierMotionRail status="UNKNOWN" />
      </div>

      {/* Empty state */}
      {shipments.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(198,165,90,0.35)", padding: "60px 0", textAlign: "center", border: "1px solid rgba(198,165,90,0.1)", borderRadius: 4 }}>
          No shipments yet. Create a courier label from a matter to begin.
        </div>
      )}

      {STATUS_GROUPS.map(({ status, label, color }) => {
        const rows = shipments.filter((s) => status.includes(s.courier_status));
        if (rows.length === 0) return null;

        return (
          <div key={label} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color }}>
                {label} ({rows.length})
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rows.map((shipment) => (
                <div
                  key={shipment.id}
                  style={{
                    padding: "14px 16px",
                    background: "#0B0B0B",
                    border: `1px solid ${shipment.courier_status === "EXCEPTION" ? "rgba(184,92,92,0.3)" : "rgba(198,165,90,0.1)"}`,
                    borderRadius: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f6f1e6" }}>
                      {shipment.deals?.client_name ?? "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(198,165,90,0.5)", fontFamily: "monospace" }}>
                      {shipment.tracking_number ?? "No tracking number"}
                    </div>
                    {shipment.carrier && (
                      <div style={{ fontSize: 10, color: "rgba(198,165,90,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {shipment.carrier}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      border: `1px solid ${statusColor(shipment.courier_status)}44`,
                      borderRadius: 2,
                      color: statusColor(shipment.courier_status),
                    }}>
                      {shipment.courier_status.replace(/_/g, " ")}
                    </div>

                    <div style={{ fontSize: 10, color: "rgba(198,165,90,0.4)" }}>
                      {fmt(shipment.label_created_at)}
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <Link
                        href={`/dashboard/deals/${shipment.matter_id}`}
                        style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(198,165,90,0.7)", textDecoration: "none", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 2 }}
                      >
                        Matter
                      </Link>

                      {shipment.tracking_url && (
                        <a
                          href={shipment.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(198,165,90,0.7)", textDecoration: "none", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 2 }}
                        >
                          Track
                        </a>
                      )}

                      <Link
                        href={`/dashboard/releases?matter_id=${shipment.matter_id}`}
                        style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(198,165,90,0.7)", textDecoration: "none", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 2 }}
                      >
                        Release Review
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
