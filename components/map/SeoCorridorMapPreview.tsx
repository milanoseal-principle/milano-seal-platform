"use client"

import Link from "next/link"
import { getGlobalRoute } from "@/src/features/corridors/globalRouteData"

interface Props {
  slug: string
  className?: string
}

export function SeoCorridorMapPreview({ slug, className }: Props) {
  const route = getGlobalRoute(slug)
  if (!route) return null

  const normalizedLng = ((route.lng + 180) / 360) * 100
  const normalizedLat = 100 - ((route.lat + 90) / 180) * 100
  const destX = 20 + (normalizedLng * 0.6)
  const destY = 20 + (normalizedLat * 0.6)
  const srcX = 22
  const srcY = 68
  const mx = (srcX + destX) / 2
  const my = Math.min(srcY, destY) - 15

  return (
    <div
      className={className}
      style={{ maxWidth: 400, background: "#0A0A0A", border: "1px solid rgba(198,165,90,0.35)", borderRadius: 10, padding: 16, fontFamily: "monospace" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{route.flag}</span>
        <div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{route.name}</div>
          <span style={{
            fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
            color: route.hague ? "#C6A55A" : "#8A8A8A",
            border: `1px solid ${route.hague ? "rgba(198,165,90,0.4)" : "rgba(138,138,138,0.3)"}`,
            padding: "1px 6px", borderRadius: 3
          }}>
            {route.hague ? "Hague Convention" : "Non-Hague"}
          </span>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ color: "#8A8A8A", fontSize: 9, letterSpacing: "0.1em" }}>TIMELINE</div>
          <div style={{ color: "#C6A55A", fontSize: 10 }}>{route.timeline}</div>
        </div>
      </div>

      <svg width="100%" viewBox="0 0 100 80" style={{ display: "block", marginBottom: 12 }}>
        <rect width={100} height={80} fill="#060608" rx={4} />
        {[20, 40, 60].map((y) => <line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#C6A55A" strokeWidth={0.2} strokeOpacity={0.15} />)}
        {[20, 40, 60, 80].map((x) => <line key={x} x1={x} y1={0} x2={x} y2={80} stroke="#C6A55A" strokeWidth={0.2} strokeOpacity={0.15} />)}
        <path d={`M ${srcX} ${srcY} Q ${mx} ${my} ${destX} ${destY}`} fill="none" stroke="#C6A55A" strokeWidth={0.8} strokeOpacity={0.5} strokeDasharray="3 2" />
        <circle cx={srcX} cy={srcY} r={2.5} fill="#C6A55A" />
        <text x={srcX + 3} y={srcY + 1} fill="#C6A55A" fontSize={4} opacity={0.7}>FL</text>
        <circle cx={destX} cy={destY} r={3} fill="#C6A55A" />
        <text x={destX + 3.5} y={destY + 1} fill="#fff" fontSize={4}>{route.flag}</text>
      </svg>

      <div style={{ marginBottom: 10 }}>
        <div style={{ color: "#8A8A8A", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Execution Path</div>
        {route.executionPath.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
            <span style={{ color: "#C6A55A", fontSize: 9, minWidth: 14, paddingTop: 1 }}>{i + 1}.</span>
            <span style={{ color: "#C0C0C0", fontSize: 10, lineHeight: 1.4 }}>{step}</span>
          </div>
        ))}
      </div>

      {route.translationRequired && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "4px 8px", background: "rgba(198,165,90,0.06)", borderRadius: 4 }}>
          <span style={{ color: "#C6A55A", fontSize: 9 }}>⚑</span>
          <span style={{ color: "#C6A55A", fontSize: 9, letterSpacing: "0.1em" }}>TRANSLATION REQUIRED</span>
        </div>
      )}

      <Link
        href={`/intake?destination=${slug}`}
        style={{ display: "block", textAlign: "center", padding: "8px 0", border: "1px solid rgba(198,165,90,0.5)", borderRadius: 5, color: "#C6A55A", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none" }}
      >
        Begin Intake →
      </Link>
    </div>
  )
}
