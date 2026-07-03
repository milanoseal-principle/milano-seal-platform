"use client";
"use client"

import { useEffect, useRef, useState } from "react"
import { getGlobalRoute } from "@/src/features/corridors/globalRouteData"

interface Props {
  slug: string
  status?: "preparing" | "in_transit" | "delivered"
  className?: string
}

const STATUS_COLOR: Record<string, string> = {
  preparing: "#F59E0B",
  in_transit: "#3B82F6",
  delivered: "#22C55E",
}

const STATUS_LABEL: Record<string, string> = {
  preparing: "Preparing",
  in_transit: "In Transit",
  delivered: "Delivered",
}

const STATUS_PROGRESS: Record<string, number> = {
  preparing: 0,
  in_transit: 0.5,
  delivered: 1,
}

const SRC_X = 18
const SRC_Y = 62
const DEST_X = 62
const DEST_Y = 28
const MID_X = (SRC_X + DEST_X) / 2
const MID_Y = Math.min(SRC_Y, DEST_Y) - 12

function pointOnQuadratic(t: number): [number, number] {
  const x = (1 - t) * (1 - t) * SRC_X + 2 * (1 - t) * t * MID_X + t * t * DEST_X
  const y = (1 - t) * (1 - t) * SRC_Y + 2 * (1 - t) * t * MID_Y + t * t * DEST_Y
  return [x, y]
}

export function ShippingCorridorMiniMap({ slug, status = "preparing", className }: Props) {
  const route = getGlobalRoute(slug)
  const [progress, setProgress] = useState(STATUS_PROGRESS[status])
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const target = STATUS_PROGRESS[status]
    setProgress(target)
  }, [status])

  if (!route) return null

  const [dotX, dotY] = pointOnQuadratic(progress)
  const color = STATUS_COLOR[status]

  return (
    <div
      data-critical-card=""
      className={className}
      style={{ width: 280, maxWidth: "100%", background: "#0A0A0A", border: "1px solid rgba(198,165,90,0.25)", borderRadius: 8, padding: 12, fontFamily: "monospace" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{route.flag}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{route.name}</div>
          <div style={{ color: "#8A8A8A", fontSize: 9, letterSpacing: "0.1em" }}>{route.routeType}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>{STATUS_LABEL[status]}</span>
        </div>
      </div>

      <svg width="100%" viewBox="0 0 80 80" style={{ display: "block", marginBottom: 8 }}>
        <rect width={80} height={80} fill="#060608" rx={4} />
        {[20, 40, 60].map((v) => (
          <line key={`h${v}`} x1={0} y1={v} x2={80} y2={v} stroke="#C6A55A" strokeWidth={0.2} strokeOpacity={0.12} />
        ))}
        {[20, 40, 60].map((v) => (
          <line key={`v${v}`} x1={v} y1={0} x2={v} y2={80} stroke="#C6A55A" strokeWidth={0.2} strokeOpacity={0.12} />
        ))}
        <path
          d={`M ${SRC_X} ${SRC_Y} Q ${MID_X} ${MID_Y} ${DEST_X} ${DEST_Y}`}
          fill="none" stroke="#C6A55A" strokeWidth={0.8} strokeOpacity={0.3}
        />
        <circle cx={SRC_X} cy={SRC_Y} r={2} fill="#C6A55A" />
        <text x={SRC_X + 2.5} y={SRC_Y + 1} fill="#C6A55A" fontSize={4} opacity={0.7}>FL</text>
        <circle cx={DEST_X} cy={DEST_Y} r={2.5} fill="#C6A55A" fillOpacity={0.7} />
        <circle cx={dotX} cy={dotY} r={3} fill={color} style={{ transition: "cx 0.6s ease, cy 0.6s ease" }} />
        <circle cx={dotX} cy={dotY} r={5} fill="none" stroke={color} strokeWidth={0.8} strokeOpacity={0.4} />
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#8A8A8A", fontSize: 9, letterSpacing: "0.1em" }}>ETA</span>
        <span style={{ color: "#C6A55A", fontSize: 10 }}>{route.timeline}</span>
      </div>
    </div>
  )
}
