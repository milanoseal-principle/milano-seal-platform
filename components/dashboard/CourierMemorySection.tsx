"use client";

import { useState } from "react";
import Link from "next/link";

const COURIER_MEMORY_CATEGORIES = [
  {
    id: "ADDRESS_CORRECTION",
    label: "Address Correction",
    description:
      "Addresses that required correction before or during shipment. Review for patterns.",
    color: "#C99A3D",
    route: "/dashboard/shipping",
  },
  {
    id: "COURIER_EXCEPTION",
    label: "Courier Exception",
    description:
      "Shipments that triggered carrier exception events. Document cause and resolution.",
    color: "#B85C5C",
    route: "/dashboard/shipping",
  },
  {
    id: "RETURNED_SHIPMENT",
    label: "Returned Shipment",
    description:
      "Documents returned to sender. Log reason and corrective action taken.",
    color: "#B85C5C",
    route: "/dashboard/shipping",
  },
  {
    id: "CUSTOMS_REVIEW",
    label: "Customs Review",
    description:
      "Shipments held or reviewed by customs authorities. Track country and document patterns.",
    color: "#C99A3D",
    route: "/dashboard/shipping",
  },
  {
    id: "FAILED_DELIVERY",
    label: "Failed Delivery",
    description:
      "Delivery attempts that failed due to recipient unavailability or access issues.",
    color: "#C99A3D",
    route: "/dashboard/shipping",
  },
  {
    id: "DELIVERED_NOT_RELEASED",
    label: "Delivered Not Released",
    description:
      "Documents delivered but awaiting operator release review. Must not auto-release.",
    color: "#C6A55A",
    route: "/dashboard/releases",
  },
  {
    id: "TRACKING_STALE",
    label: "Tracking Stale",
    description:
      "Shipments with no tracking update for 48+ hours. May require carrier follow-up.",
    color: "#C6A55A",
    route: "/dashboard/shipping",
  },
  {
    id: "CERTIFICATE_CORRECTION",
    label: "Certificate Correction",
    description:
      "Release certificates that required correction after initial generation.",
    color: "#C6A55A",
    route: "/dashboard/releases",
  },
];

export function CourierMemorySection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: 4,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Courier Memory Categories
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 2,
            border: `1px solid ${activeCategory === null ? "rgba(198,165,90,0.5)" : "rgba(198,165,90,0.15)"}`,
            background: activeCategory === null ? "rgba(198,165,90,0.08)" : "transparent",
            color: activeCategory === null ? "#C6A55A" : "rgba(255,255,255,0.35)",
            cursor: "pointer",
          }}
        >
          All
        </button>
        {COURIER_MEMORY_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            style={{
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: 2,
              border: `1px solid ${activeCategory === cat.id ? cat.color + "60" : "rgba(255,255,255,0.1)"}`,
              background: activeCategory === cat.id ? cat.color + "12" : "transparent",
              color: activeCategory === cat.id ? cat.color : "rgba(255,255,255,0.35)",
              cursor: "pointer",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 10,
        }}
      >
        {COURIER_MEMORY_CATEGORIES.filter(
          (c) => activeCategory === null || c.id === activeCategory
        ).map((cat) => (
          <div
            key={cat.id}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${cat.color}22`,
              borderRadius: 3,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: cat.color,
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              {cat.label}
            </div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.5,
              }}
            >
              {cat.description}
            </p>
            <Link
              href={cat.route}
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                letterSpacing: "0.08em",
              }}
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
