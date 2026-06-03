"use client";

import type { MilanoCourierStatus } from "@/lib/shippo/types";

export interface ShippoStatusBadgeProps {
  status: MilanoCourierStatus;
  size?: "sm" | "md";
}

function badgeColor(status: MilanoCourierStatus): { text: string; border: string; bg: string } {
  switch (status) {
    case "DELIVERED":
      return { text: "#3FA47A", border: "rgba(63,164,122,0.35)", bg: "rgba(63,164,122,0.08)" };
    case "TRANSIT":
    case "OUT_FOR_DELIVERY":
      return { text: "#3FA47A", border: "rgba(63,164,122,0.25)", bg: "rgba(63,164,122,0.06)" };
    case "PRE_TRANSIT":
      return { text: "#C99A3D", border: "rgba(201,154,61,0.35)", bg: "rgba(201,154,61,0.08)" };
    case "LABEL_CREATED":
      return { text: "#C6A55A", border: "rgba(198,165,90,0.3)", bg: "rgba(198,165,90,0.06)" };
    case "EXCEPTION":
      return { text: "#B85C5C", border: "rgba(184,92,92,0.4)", bg: "rgba(184,92,92,0.08)" };
    case "RETURNED":
      return { text: "#B85C5C", border: "rgba(184,92,92,0.3)", bg: "rgba(184,92,92,0.06)" };
    case "UNKNOWN":
    default:
      return { text: "#6F6A63", border: "rgba(111,106,99,0.3)", bg: "rgba(111,106,99,0.05)" };
  }
}

function statusLabel(status: MilanoCourierStatus): string {
  switch (status) {
    case "LABEL_CREATED":    return "Label Created";
    case "PRE_TRANSIT":      return "Pre-Transit";
    case "TRANSIT":          return "In Transit";
    case "OUT_FOR_DELIVERY": return "Out for Delivery";
    case "DELIVERED":        return "Delivered";
    case "EXCEPTION":        return "Exception";
    case "RETURNED":         return "Returned";
    case "UNKNOWN":          return "Unknown";
  }
}

export function ShippoStatusBadge({ status, size = "md" }: ShippoStatusBadgeProps) {
  const { text, border, bg } = badgeColor(status);
  const fontSize = size === "sm" ? 9 : 10;
  const padding = size === "sm" ? "2px 6px" : "3px 8px";

  return (
    <span
      style={{
        display: "inline-block",
        fontSize,
        fontFamily: "'Inter', system-ui, sans-serif",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: text,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 2,
        padding,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

export default ShippoStatusBadge;
