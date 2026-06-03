"use client";

import type { MilanoCourierStatus } from "@/lib/shippo/types";

export interface ShippoCourierMotionRailProps {
  status: MilanoCourierStatus;
  carrier?: string | null;
  trackingNumberDisplay?: string | null;
  trackingUrl?: string | null;
  lastUpdate?: string | null;
  compact?: boolean;
}

type RailNode = {
  key: MilanoCourierStatus | "ORIGIN";
  label: string;
  statuses: MilanoCourierStatus[];
};

const RAIL_NODES: RailNode[] = [
  { key: "ORIGIN",        label: "Origin",      statuses: ["LABEL_CREATED"] },
  { key: "PRE_TRANSIT",   label: "Pre-Transit", statuses: ["PRE_TRANSIT"] },
  { key: "TRANSIT",       label: "Transit",     statuses: ["TRANSIT", "OUT_FOR_DELIVERY"] },
  { key: "DELIVERY",      label: "Delivery",    statuses: [] }, // virtual step
  { key: "DELIVERED",     label: "Delivered",   statuses: ["DELIVERED"] },
];

function nodeState(
  node: RailNode,
  status: MilanoCourierStatus
): "active" | "completed" | "inactive" {
  const ORDER: MilanoCourierStatus[] = [
    "LABEL_CREATED",
    "PRE_TRANSIT",
    "TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];
  const currentIdx = ORDER.indexOf(status);

  if (node.statuses.includes(status)) return "active";

  // Check if any of the node's statuses are before the current status
  const nodeMaxIdx = Math.max(...node.statuses.map((s) => ORDER.indexOf(s)));
  if (nodeMaxIdx !== -1 && currentIdx > nodeMaxIdx) return "completed";

  // Virtual DELIVERY node — completed when DELIVERED
  if (node.key === "DELIVERY" && (status === "DELIVERED" || status === "OUT_FOR_DELIVERY")) {
    return status === "DELIVERED" ? "completed" : "active";
  }

  // ORIGIN/LABEL_CREATED — completed once past
  if (node.key === "ORIGIN" && currentIdx > ORDER.indexOf("LABEL_CREATED")) return "completed";

  return "inactive";
}

function nodeColor(state: "active" | "completed" | "inactive", nodeKey: string): string {
  if (state === "inactive") return "#2A2A2A";
  if (nodeKey === "DELIVERED" && state === "active") return "#3FA47A";
  if (state === "completed") return "#C6A55A";
  return "#C6A55A";
}

function nodeStroke(state: "active" | "completed" | "inactive", nodeKey: string): string {
  if (state === "inactive") return "#444444";
  if (nodeKey === "DELIVERED" && state === "active") return "#3FA47A";
  return "#C6A55A";
}

function segmentColor(leftState: "active" | "completed" | "inactive"): string {
  return leftState === "completed" || leftState === "active" ? "#C6A55A" : "#2A2A2A";
}

export default function ShippoCourierMotionRail({
  status,
  carrier,
  trackingNumberDisplay,
  trackingUrl,
  lastUpdate,
  compact = false,
}: ShippoCourierMotionRailProps) {
  const isException = status === "EXCEPTION";
  const isReturned = status === "RETURNED";
  const isUnknown = status === "UNKNOWN";

  const railHeight = compact ? 48 : 72;
  const nodeR = compact ? 6 : 8;
  const labelFontSize = compact ? 8 : 9;
  const cy = compact ? 20 : 28;

  // For RETURNED: origin node re-activates, rest muted
  function getEffectiveStatus(node: RailNode): "active" | "completed" | "inactive" {
    if (isReturned) {
      return node.key === "ORIGIN" ? "active" : "inactive";
    }
    if (isUnknown) return "inactive";
    return nodeState(node, status);
  }

  return (
    <div
      style={{
        fontFamily: "var(--ms-font-body, 'Inter', system-ui, sans-serif)",
        padding: compact ? "10px 0" : "16px 0",
      }}
    >
      {/* Exception bar */}
      {isException && (
        <div
          style={{
            padding: compact ? "6px 12px" : "8px 16px",
            background: "rgba(184,92,92,0.12)",
            border: "1px solid rgba(184,92,92,0.4)",
            borderRadius: 3,
            marginBottom: 12,
            fontSize: compact ? 10 : 11,
            color: "#B85C5C",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            boxShadow: "0 0 12px 0 rgba(184,92,92,0.18)",
          }}
        >
          Courier Exception — Operator Review Required
        </div>
      )}

      {/* Returned notice */}
      {isReturned && !compact && (
        <div
          style={{
            padding: "6px 12px",
            background: "rgba(201,154,61,0.1)",
            border: "1px solid rgba(201,154,61,0.3)",
            borderRadius: 3,
            marginBottom: 12,
            fontSize: 10,
            color: "#C99A3D",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Shipment Returned to Origin
        </div>
      )}

      {/* SVG Rail */}
      <svg
        width="100%"
        viewBox={`0 0 320 ${railHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Courier status: ${status}`}
        role="img"
        style={{ display: "block" }}
      >
        {/* Rail segments between nodes */}
        {RAIL_NODES.map((node, i) => {
          if (i === RAIL_NODES.length - 1) return null;
          const x1 = 32 + i * 64 + nodeR;
          const x2 = 32 + (i + 1) * 64 - nodeR;
          const leftState = getEffectiveStatus(node);
          return (
            <line
              key={`seg-${i}`}
              x1={x1}
              y1={cy}
              x2={x2}
              y2={cy}
              stroke={isException ? "#3A1A1A" : segmentColor(leftState)}
              strokeWidth={compact ? 1.5 : 2}
            />
          );
        })}

        {/* Nodes */}
        {RAIL_NODES.map((node, i) => {
          const cx = 32 + i * 64;
          const state = getEffectiveStatus(node);
          const fill = isException ? "#1A0808" : nodeColor(state, node.key);
          const stroke = isException ? "#B85C5C" : nodeStroke(state, node.key);

          return (
            <g key={node.key}>
              {/* Glow ring for active node */}
              {state === "active" && !isException && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={nodeR + 4}
                  fill="none"
                  stroke={node.key === "DELIVERED" ? "rgba(63,164,122,0.25)" : "rgba(198,165,90,0.2)"}
                  strokeWidth={1}
                />
              )}
              {/* Exception glow */}
              {isException && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={nodeR + 4}
                  fill="none"
                  stroke="rgba(184,92,92,0.15)"
                  strokeWidth={1}
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={nodeR}
                fill={fill}
                stroke={stroke}
                strokeWidth={compact ? 1.5 : 2}
              />
              {/* Check mark for completed */}
              {state === "completed" && !compact && (
                <path
                  d={`M${cx - 3} ${cy} l2.5 2.5 l4 -4`}
                  stroke="#0A0A0A"
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Label */}
              {(state !== "inactive" || !compact) && (
                <text
                  x={cx}
                  y={cy + nodeR + (compact ? 10 : 14)}
                  textAnchor="middle"
                  fontSize={labelFontSize}
                  fill={
                    isException
                      ? "#B85C5C"
                      : state === "inactive"
                      ? "#444444"
                      : state === "active" && node.key === "DELIVERED"
                      ? "#3FA47A"
                      : state !== "inactive"
                      ? "#C6A55A"
                      : "#444444"
                  }
                  fontFamily="'Inter', system-ui, sans-serif"
                  letterSpacing="0.06em"
                  style={{ textTransform: "uppercase" } as React.CSSProperties}
                >
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Meta row */}
      {!compact && (carrier || trackingNumberDisplay || lastUpdate) && (
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          {carrier && (
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(198,165,90,0.5)",
              }}
            >
              {carrier}
            </span>
          )}
          {trackingNumberDisplay && trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 10,
                color: "rgba(198,165,90,0.6)",
                fontFamily: "'IBM Plex Mono', monospace",
                textDecoration: "none",
              }}
            >
              {trackingNumberDisplay}
            </a>
          ) : trackingNumberDisplay ? (
            <span
              style={{
                fontSize: 10,
                color: "rgba(198,165,90,0.5)",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {trackingNumberDisplay}
            </span>
          ) : null}
          {lastUpdate && (
            <span style={{ fontSize: 9, color: "rgba(198,165,90,0.35)" }}>
              Updated {lastUpdate}
            </span>
          )}
        </div>
      )}

      {/* Reduced-motion: hide animated elements via CSS media query */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .ms-rail-glow { display: none; }
        }
      `}</style>
    </div>
  );
}
