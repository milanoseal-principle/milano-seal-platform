"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DESTINATIONS, type Destination } from "@/data/destinations";

interface FlyToTarget { lat: number; lng: number; zoom: number; }

function getDestination(name: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase());
}

function countryStyle(name: string, isActive: boolean): L.PathOptions {
  const dest = getDestination(name);
  return {
    fillColor: isActive ? "#C6A55A" : dest ? "#1E1A14" : "#0D0D0D",
    fillOpacity: 1,
    color: "#1A1A1A",
    weight: 0.5,
  };
}

interface LayerControlProps {
  active: Destination | null;
  setActive: (d: Destination | null) => void;
  flyTarget: FlyToTarget | null;
}

function LayerControl({ active, setActive, flyTarget }: LayerControlProps) {
  const map = useMap();
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const activeRef = useRef<Destination | null>(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    fetch("/world.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (geoLayerRef.current) map.removeLayer(geoLayerRef.current);
        const layer = L.geoJSON(data, {
          style: (feature) => {
            const name = (feature?.properties?.name as string) ?? "";
            return countryStyle(name, activeRef.current?.name === name);
          },
          onEachFeature: (feature, featureLayer) => {
            const name = (feature?.properties?.name as string) ?? "";
            const dest = getDestination(name);
            if (!dest) return;
            const path = featureLayer as L.Path;
            path.on("mouseover", () => {
              if (activeRef.current?.name !== name) {
                path.setStyle({ fillColor: "#C6A55A", fillOpacity: 0.85 });
                path.bringToFront();
              }
            });
            path.on("mouseout", () => {
              if (activeRef.current?.name !== name)
                path.setStyle({ fillColor: "#1E1A14", fillOpacity: 1 });
            });
            path.on("click", () => setActive(dest));
          },
        });
        layer.addTo(map);
        geoLayerRef.current = layer;
      });
    return () => {
      if (geoLayerRef.current) { map.removeLayer(geoLayerRef.current); geoLayerRef.current = null; }
    };
  }, [map]);

  useEffect(() => {
    if (!geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((fl) => {
      const l = fl as L.Path & { feature?: GeoJSON.Feature };
      const name = (l.feature?.properties?.name as string) ?? "";
      l.setStyle(countryStyle(name, active?.name === name));
    });
  }, [active]);

  useEffect(() => {
    if (flyTarget) map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom, { duration: 0.8 });
  }, [flyTarget, map]);

  // Fly to selected destination (prefer ROUTE_DESTS coords, fall back to Destination coords)
  useEffect(() => {
    if (!active) return;
    const dest = ROUTE_DESTS.find(d => d.name === active.name);
    if (dest) {
      map.flyTo([dest.lat, dest.lng], 5, { duration: 1.1, easeLinearity: 0.3 });
    } else if (active.lat != null && active.lng != null) {
      map.flyTo([active.lat, active.lng], 5, { duration: 1.1, easeLinearity: 0.3 });
    }
  }, [active, map]);

  return null;
}

// ── Global Hague routing nodes ─────────────────────────────────────────────
const ORIGIN_LL: [number, number] = [25.7617, -80.1918];

const ROUTE_DESTS = [
  // Americas
  { name: "Dominican Republic", lat: 18.4861,  lng: -69.9312 },
  { name: "Panama",             lat:  8.9936,  lng: -79.5197 },
  { name: "Colombia",           lat:  4.7110,  lng: -74.0721 },
  { name: "Venezuela",          lat: 10.4880,  lng: -66.8792 },
  { name: "Ecuador",            lat: -0.1807,  lng: -78.4678 },
  { name: "Peru",               lat: -12.0464, lng: -77.0428 },
  { name: "Brazil",             lat: -15.7797, lng: -47.9297 },
  { name: "Argentina",          lat: -34.6037, lng: -58.3816 },
  { name: "Chile",              lat: -33.4489, lng: -70.6693 },
  { name: "Uruguay",            lat: -34.9011, lng: -56.1645 },
  // Europe
  { name: "Spain",              lat: 40.4168,  lng:  -3.7038 },
  { name: "Portugal",           lat: 38.7223,  lng:  -9.1393 },
  { name: "France",             lat: 48.8566,  lng:   2.3522 },
  { name: "United Kingdom",     lat: 51.5074,  lng:  -0.1278 },
  { name: "Netherlands",        lat: 52.3676,  lng:   4.9041 },
  { name: "Belgium",            lat: 50.8503,  lng:   4.3517 },
  { name: "Germany",            lat: 52.5200,  lng:  13.4050 },
  { name: "Switzerland",        lat: 46.9481,  lng:   7.4474 },
  { name: "Austria",            lat: 48.2082,  lng:  16.3738 },
  { name: "Italy",              lat: 41.9028,  lng:  12.4964 },
  { name: "Greece",             lat: 37.9838,  lng:  23.7275 },
  { name: "Poland",             lat: 52.2297,  lng:  21.0122 },
  { name: "Romania",            lat: 44.4268,  lng:  26.1025 },
  { name: "Turkey",             lat: 39.9334,  lng:  32.8597 },
  { name: "Sweden",             lat: 59.3293,  lng:  18.0686 },
  { name: "Norway",             lat: 59.9139,  lng:  10.7522 },
  // Asia-Pacific & ME
  { name: "Morocco",            lat: 34.0209,  lng:  -6.8416 },
  { name: "Israel",             lat: 31.7683,  lng:  35.2137 },
  { name: "UAE",                lat: 24.4539,  lng:  54.3773 },
  { name: "India",              lat: 28.6139,  lng:  77.2090 },
  { name: "Japan",              lat: 35.6762,  lng: 139.6503 },
  { name: "South Korea",        lat: 37.5665,  lng: 126.9780 },
  { name: "Philippines",        lat: 14.5995,  lng: 120.9842 },
  { name: "Australia",          lat: -35.2809, lng: 149.1300 },
  { name: "New Zealand",        lat: -41.2865, lng: 174.7762 },
  { name: "Singapore",          lat:  1.3521,  lng: 103.8198 },
  // Africa
  { name: "South Africa",       lat: -25.7461, lng:  28.1881 },
  { name: "Senegal",            lat: 14.7167,  lng: -17.4677 },
  { name: "Mauritius",          lat: -20.1609, lng:  57.4992 },
];

// Primary featured routes — always visible, always in sync with map clicks
const PRIMARY_ROUTES = [
  { name: "Italy",  lat: 41.9028, lng:  12.4964 },
  { name: "Spain",  lat: 40.4168, lng:  -3.7038 },
  { name: "UAE",    lat: 24.4539, lng:  54.3773 },
  { name: "Brazil", lat: -15.7797, lng: -47.9297 },
  { name: "Mexico", lat: 19.4326, lng: -99.1332 },
];

function arcD(ox: number, oy: number, dx: number, dy: number, spread: number): string {
  const mx = (ox + dx) / 2;
  const my = (oy + dy) / 2 - Math.abs(dx - ox) * 0.28 + spread;
  return `M ${ox.toFixed(1)} ${oy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`;
}

function MapSVGRoutes({ active }: { active: Destination | null }) {
  const map = useMap();
  const [, mapBump] = useState(0);

  useEffect(() => {
    const tick = () => mapBump((n) => n + 1);
    map.on("move", tick); map.on("zoom", tick); map.on("resize", tick);
    return () => { map.off("move", tick); map.off("zoom", tick); map.off("resize", tick); };
  }, [map]);

  const sz = map.getSize();
  const op = map.latLngToContainerPoint(ORIGIN_LL);

  // Resolve all primary routes to pixel coords
  const routes = PRIMARY_ROUTES.map((r, i) => ({
    ...r,
    pt: map.latLngToContainerPoint([r.lat, r.lng]),
    spread: (i - 2) * 6, // spread control points so arcs don't stack
  }));

  // Also resolve selected destination if it's not in PRIMARY_ROUTES
  const activeInPrimary = active ? PRIMARY_ROUTES.find(r => r.name === active.name) : null;
  const activeExtra = active && !activeInPrimary && active.lat != null && active.lng != null ? {
    name: active.name,
    pt: map.latLngToContainerPoint([active.lat, active.lng]),
    spread: 0,
  } : null;

  const hasSelection = !!active;

  const overlay = (
    <svg
      style={{
        position: "absolute", top: 0, left: 0,
        width: sz.x, height: sz.y,
        pointerEvents: "none", zIndex: 500, overflow: "visible",
        transform: "translateZ(0)",
      }}
    >
      <defs>
        <filter id="ms-bloom-heavy" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ms-bloom-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
        <filter id="ms-dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Primary route arcs — always present, dim/bright based on selection ── */}
      {routes.map((r) => {
        const isSelected = active?.name === r.name;
        const isDimmed   = hasSelection && !isSelected;
        const d = arcD(op.x, op.y, r.pt.x, r.pt.y, r.spread);

        return (
          <g key={`arc-${r.name}`} style={{
            opacity: isDimmed ? 0.04 : isSelected ? 1 : 0.18,
            transition: "opacity 0.6s ease",
          }}>
            {/* Soft bloom halo */}
            <path d={d} fill="none" stroke="#D4AF37"
              strokeWidth={isSelected ? 14 : 6} opacity="0.15"
              filter="url(#ms-bloom-soft)" />
            {/* Core arc */}
            <path d={d} fill="none" stroke="#C6A55A"
              strokeWidth={isSelected ? 2.2 : 1}
              opacity={isSelected ? 0.9 : 0.7}
              style={{ mixBlendMode: "screen" as React.CSSProperties["mixBlendMode"] }}
            >
              {isSelected && (
                <animate attributeName="stroke-dasharray" from="0 2000" to="2000 0"
                  dur="1.0s" fill="freeze" key={`draw-${r.name}`} />
              )}
            </path>
            {/* Champagne filament — only when selected */}
            {isSelected && (
              <path d={d} fill="none" stroke="#F4E5B8"
                strokeWidth="1" opacity="0.85" strokeDasharray="8 5">
                <animate attributeName="stroke-dashoffset" from="0" to="-39"
                  dur="1.8s" repeatCount="indefinite" />
              </path>
            )}
          </g>
        );
      })}

      {/* ── Extra arc for non-primary selected destination ─────────────────── */}
      {activeExtra && (() => {
        const d = arcD(op.x, op.y, activeExtra.pt.x, activeExtra.pt.y, 0);
        return (
          <g key={`arc-extra-${activeExtra.name}`}>
            <path d={d} fill="none" stroke="#D4AF37" strokeWidth={14} opacity="0.15"
              filter="url(#ms-bloom-soft)" />
            <path d={d} fill="none" stroke="#C6A55A" strokeWidth="2.2" opacity="0.9"
              style={{ mixBlendMode: "screen" as React.CSSProperties["mixBlendMode"] }}>
              <animate attributeName="stroke-dasharray" from="0 2000" to="2000 0"
                dur="1.0s" fill="freeze" key={`draw-extra-${activeExtra.name}`} />
            </path>
            <path d={d} fill="none" stroke="#F4E5B8"
              strokeWidth="1" opacity="0.85" strokeDasharray="8 5">
              <animate attributeName="stroke-dashoffset" from="0" to="-39"
                dur="1.8s" repeatCount="indefinite" />
            </path>
          </g>
        );
      })()}

      {/* ── Primary destination nodes ─────────────────────────────────────── */}
      {routes.map((r) => {
        const isSelected = active?.name === r.name;
        const isDimmed   = hasSelection && !isSelected;
        return (
          <g key={`node-${r.name}`} style={{
            opacity: isDimmed ? 0.06 : isSelected ? 1 : 0.45,
            transition: "opacity 0.6s ease",
          }}>
            {/* Slow idle ripple — only when not selected */}
            {!isSelected && (
              <circle cx={r.pt.x} cy={r.pt.y} r="3" fill="none" stroke="#C6A55A" strokeWidth="0.6">
                <animate attributeName="r" values="3;14" dur="7s"
                  calcMode="spline" keySplines="0.16 1 0.3 1" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" dur="7s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Active pulse rings */}
            {isSelected && (<>
              <circle cx={r.pt.x} cy={r.pt.y} r="5" fill="none" stroke="#C6A55A" strokeWidth="1.4">
                <animate attributeName="r" values="5;26" dur="2.2s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.16 1 0.3 1" />
                <animate attributeName="opacity" values="0.85;0" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx={r.pt.x} cy={r.pt.y} r="5" fill="none" stroke="#C6A55A" strokeWidth="0.8">
                <animate attributeName="r" values="5;16" dur="2.2s" begin="0.9s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.16 1 0.3 1" />
                <animate attributeName="opacity" values="0.55;0" dur="2.2s" begin="0.9s" repeatCount="indefinite" />
              </circle>
            </>)}
            {/* Core dot */}
            <circle cx={r.pt.x} cy={r.pt.y} r={isSelected ? 5 : 3}
              fill={isSelected ? "#F4E5B8" : "#C6A55A"}
              filter="url(#ms-dot-glow)"
              style={{ transition: "r 0.4s ease" }}
            />
          </g>
        );
      })}

      {/* ── Extra node for non-primary selected destination ────────────────── */}
      {activeExtra && (
        <g key={`node-extra-${activeExtra.name}`}>
          <circle cx={activeExtra.pt.x} cy={activeExtra.pt.y} r="5" fill="none" stroke="#C6A55A" strokeWidth="1.4">
            <animate attributeName="r" values="5;26" dur="2.2s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.16 1 0.3 1" />
            <animate attributeName="opacity" values="0.85;0" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={activeExtra.pt.x} cy={activeExtra.pt.y} r="5" fill="#F4E5B8"
            filter="url(#ms-dot-glow)" />
        </g>
      )}

      {/* ── Florida origin — always on ────────────────────────────────────── */}
      <g filter="url(#ms-bloom-heavy)">
        <circle cx={op.x} cy={op.y} r="5" fill="none" stroke="#F4E5B8" strokeWidth="1.5">
          <animate attributeName="r"       values="5;22" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={op.x} cy={op.y} r="5" fill="none" stroke="#F4E5B8" strokeWidth="1">
          <animate attributeName="r"       values="5;14" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx={op.x} cy={op.y} r="5" fill="#F4E5B8" />
      </g>
    </svg>
  );

  return createPortal(overlay, map.getContainer());
}

// ── MapInner export ─────────────────────────────────────────────────────────

interface Props {
  active: Destination | null;
  setActive: (d: Destination | null) => void;
  flyTarget: FlyToTarget | null;
}

export default function MapInner({ active, setActive, flyTarget }: Props) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ width: "100%", height: "480px", background: "#0A0A0A" }}
      zoomControl={false}
      attributionControl={false}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
      minZoom={1}
      maxZoom={8}
    >
      <LayerControl active={active} setActive={setActive} flyTarget={flyTarget} />
      <MapSVGRoutes active={active} />
    </MapContainer>
  );
}
