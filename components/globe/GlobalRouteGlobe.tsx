"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { GLOBAL_ROUTE_DATA, HAGUE_ROUTES, type GlobalRouteRecord } from "@/src/features/corridors/globalRouteData"

interface Props {
  selectedSlug?: string | null
  onSelectCountry?: (slug: string) => void
  className?: string
}

const GLOBE_CX = 200
const GLOBE_CY = 200
const GLOBE_R = 180

const FLORIDA: [number, number] = [27.6, -81.5]

function project(lat: number, lng: number): [number, number] {
  const x = GLOBE_CX - GLOBE_R + ((lng + 180) / 360) * (GLOBE_R * 2)
  const y = GLOBE_CY + GLOBE_R - ((lat + 90) / 180) * (GLOBE_R * 2)
  return [x, y]
}

function dotSize(demand: number): number {
  return 3 + ((demand / 100) * 5)
}

export function GlobalRouteGlobe({ selectedSlug, onSelectCountry, className }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const prevSelected = useRef<string | null | undefined>(null)

  useEffect(() => {
    if (selectedSlug !== prevSelected.current) {
      prevSelected.current = selectedSlug
      setAnimKey((k) => k + 1)
    }
  }, [selectedSlug])

  const [fx, fy] = project(...FLORIDA)

  const latLines = [-60, -30, 0, 30, 60]
  const lngLines = [-120, -60, 0, 60, 120]

  return (
    <div
      className={className}
      style={{ background: "#050507", borderRadius: 12, padding: 16, position: "relative", display: "inline-block" }}
    >
      <span style={{ position: "absolute", top: 12, left: 16, color: "#C6A55A", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace", opacity: 0.8 }}>
        Authority Coverage
      </span>

      <svg width={400} height={400} viewBox="0 0 400 400">
        <defs>
          <clipPath id="globe-clip">
            <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} />
          </clipPath>
          <radialGradient id="globe-bg" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#0D0D14" />
            <stop offset="100%" stopColor="#050507" />
          </radialGradient>
        </defs>

        <circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} fill="url(#globe-bg)" stroke="#C6A55A" strokeWidth={0.5} strokeOpacity={0.3} />

        <g clipPath="url(#globe-clip)" strokeOpacity={0.2} stroke="#C6A55A" strokeWidth={0.5} fill="none">
          {latLines.map((lat) => {
            const y = GLOBE_CY + GLOBE_R - ((lat + 90) / 180) * (GLOBE_R * 2)
            return <line key={lat} x1={GLOBE_CX - GLOBE_R} x2={GLOBE_CX + GLOBE_R} y1={y} y2={y} />
          })}
          {lngLines.map((lng) => {
            const x = GLOBE_CX - GLOBE_R + ((lng + 180) / 360) * (GLOBE_R * 2)
            return <line key={lng} x1={x} x2={x} y1={GLOBE_CY - GLOBE_R} y2={GLOBE_CY + GLOBE_R} />
          })}
        </g>

        <g clipPath="url(#globe-clip)">
          {HAGUE_ROUTES.map((route) => {
            const [tx, ty] = project(route.lat, route.lng)
            const isSelected = selectedSlug === route.slug
            const mx = (fx + tx) / 2
            const my = Math.min(fy, ty) - 40
            const pathD = `M ${fx} ${fy} Q ${mx} ${my} ${tx} ${ty}`
            const arcLen = 200
            return (
              <path
                key={route.slug}
                d={pathD}
                fill="none"
                stroke="#C6A55A"
                strokeWidth={isSelected ? 1.5 : 0.8}
                strokeOpacity={isSelected ? 0.6 : 0.15}
                strokeDasharray={isSelected ? arcLen : undefined}
                strokeDashoffset={isSelected ? 0 : undefined}
                style={isSelected ? { transition: "stroke-dashoffset 0.8s ease" } : undefined}
              />
            )
          })}
        </g>

        <g clipPath="url(#globe-clip)">
          {GLOBAL_ROUTE_DATA.map((route) => {
            const [cx, cy] = project(route.lat, route.lng)
            const isSelected = selectedSlug === route.slug
            const isHovered = hovered === route.slug
            const r = dotSize(route.demand)

            return (
              <g
                key={route.slug}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(route.slug)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectCountry?.(route.slug)}
              >
                {isSelected && (
                  <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#C6A55A" strokeWidth={1.5} strokeOpacity={0.8} />
                )}
                {isHovered && !isSelected && (
                  <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#C6A55A" strokeWidth={1} strokeOpacity={0.5} />
                )}
                {route.hague ? (
                  <circle cx={cx} cy={cy} r={r} fill="#C6A55A" fillOpacity={isSelected ? 1 : 0.8} />
                ) : (
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C6A55A" strokeWidth={1} strokeOpacity={0.5} />
                )}
              </g>
            )
          })}
        </g>

        <circle cx={fx} cy={fy} r={4} fill="#C6A55A" />
        <circle cx={fx} cy={fy} r={7} fill="none" stroke="#C6A55A" strokeWidth={1} strokeOpacity={0.4} />

        {hovered && (() => {
          const route = GLOBAL_ROUTE_DATA.find((r) => r.slug === hovered)
          if (!route) return null
          const [cx, cy] = project(route.lat, route.lng)
          const tx = cx > 300 ? cx - 80 : cx + 8
          const ty = cy < 40 ? cy + 16 : cy - 24
          return (
            <g>
              <rect x={tx - 4} y={ty - 12} width={80} height={16} rx={3} fill="#0D0D14" stroke="#C6A55A" strokeWidth={0.5} strokeOpacity={0.6} />
              <text x={tx} y={ty} fill="#C6A55A" fontSize={9} fontFamily="monospace">{route.flag} {route.name}</text>
            </g>
          )
        })()}
      </svg>

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Link
          href="/intake"
          style={{ color: "#C6A55A", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", textDecoration: "none", borderBottom: "1px solid rgba(198,165,90,0.4)", paddingBottom: 2 }}
        >
          Begin Intake →
        </Link>
      </div>
    </div>
  )
}
