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

const N = ROUTE_DESTS.length;

// Opacity based on how recently a route was "lit" in the sweep
function sweepOpacity(age: number): number {
  if (age === 0) return 0.92;
  if (age === 1) return 0.62;
  if (age === 2) return 0.34;
  if (age === 3) return 0.16;
  return 0.055; // persistent ghost
}

function arcD(ox: number, oy: number, dx: number, dy: number, i: number): string {
  const mx = (ox + dx) / 2;
  // Spread control points so European arcs don't stack perfectly
  const spread = ((i % 7) - 3) * 4;
  const my = (oy + dy) / 2 - Math.abs(dx - ox) * 0.24 + spread;
  return `M ${ox.toFixed(1)} ${oy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`;
}

function MapSVGRoutes() {
  const map = useMap();
  const [, mapBump]  = useState(0);
  const [spotIdx, setSpotIdx] = useState(0);

  // Reproject SVG on map pan / zoom
  useEffect(() => {
    const tick = () => mapBump((n) => n + 1);
    map.on("move", tick); map.on("zoom", tick); map.on("resize", tick);
    return () => { map.off("move", tick); map.off("zoom", tick); map.off("resize", tick); };
  }, [map]);

  // Radar sweep — advance one node every 480ms
  useEffect(() => {
    const t = setInterval(() => setSpotIdx((s) => (s + 1) % N), 480);
    return () => clearInterval(t);
  }, []);

  const sz = map.getSize();
  const op = map.latLngToContainerPoint(ORIGIN_LL);

  const routes = ROUTE_DESTS.map((d, i) => ({
    ...d,
    pt:  map.latLngToContainerPoint([d.lat, d.lng]),
    age: (i - spotIdx + N) % N,
    i,
  }));

  const overlay = (
    <svg
      style={{
        position: "absolute", top: 0, left: 0,
        width: sz.x, height: sz.y,
        pointerEvents: "none", zIndex: 500, overflow: "visible",
        transform: "translateZ(0)", willChange: "transform",
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

      {/* ── Arc filaments — drawn back-to-front (ghosts first, active on top) ── */}
      {[...routes].sort((a, b) => b.age - a.age).map((r) => {
        const d    = arcD(op.x, op.y, r.pt.x, r.pt.y, r.i);
        const opa  = sweepOpacity(r.age);
        const isHot = r.age <= 1;
        return (
          <g key={`arc-${r.name}`} style={{ opacity: opa, transition: "opacity 0.45s ease", willChange: "opacity" }}>
            {/* Outer atmospheric bloom */}
            <path d={d} fill="none" stroke="#D4AF37" strokeWidth={isHot ? 9 : 5} opacity="0.15"
              filter="url(#ms-bloom-soft)" />
            {/* Inner glow */}
            <path d={d} fill="none" stroke="#D4AF37" strokeWidth={isHot ? 3.5 : 2} opacity="0.50"
              style={{ mixBlendMode: "screen" as React.CSSProperties["mixBlendMode"] }} />
            {/* Core champagne filament */}
            <path d={d} fill="none" stroke="#F4E5B8" strokeWidth="1" strokeDasharray={isHot ? "10 4" : "6 6"}>
              {isHot && (
                <animate attributeName="stroke-dashoffset" from="0" to="-28"
                  dur="1.8s" repeatCount="indefinite" />
              )}
            </path>
          </g>
        );
      })}

      {/* ── Destination nodes ─────────────────────────────────────────────── */}
      {routes.map((r) => {
        const opa  = sweepOpacity(r.age);
        const isHot = r.age === 0;
        const ripRad = isHot ? 26 : 18;
        const ripDur = isHot ? "2.4s" : "3.2s";
        return (
          <g key={`node-${r.name}`} style={{ opacity: opa, transition: "opacity 0.45s ease", willChange: "opacity" }}>
            {/* Ripple ring 1 */}
            <circle cx={r.pt.x} cy={r.pt.y} r="4" fill="none" stroke="#C6A55A" strokeWidth={isHot ? 1.2 : 0.8}>
              <animate attributeName="r" values={`4;${ripRad}`} dur={ripDur}
                calcMode="spline" keySplines="0.16 1 0.3 1" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur={ripDur} repeatCount="indefinite" />
            </circle>
            {/* Ripple ring 2 — offset phase */}
            {isHot && (
              <circle cx={r.pt.x} cy={r.pt.y} r="4" fill="none" stroke="#C6A55A" strokeWidth="0.7">
                <animate attributeName="r" values="4;20" dur="1.9s" begin="0.7s"
                  calcMode="spline" keySplines="0.16 1 0.3 1" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.55;0" dur="1.9s" begin="0.7s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Core dot */}
            <circle cx={r.pt.x} cy={r.pt.y} r={isHot ? 4 : 2.5}
              fill={isHot ? "#F4E5B8" : "#D4AF37"}
              filter="url(#ms-dot-glow)"
              style={{ transition: "r 0.3s ease" }}
            />
          </g>
        );
      })}

      {/* ── Florida origin — always on ────────────────────────────────────── */}
      <g filter="url(#ms-bloom-heavy)">
        <circle cx={op.x} cy={op.y} r="5" fill="none" stroke="#F4E5B8" strokeWidth="1.5">
          <animate attributeName="r"       values="5;22"    dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0"   dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={op.x} cy={op.y} r="5" fill="none" stroke="#F4E5B8" strokeWidth="1">
          <animate attributeName="r"       values="5;14"    dur="2.2s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0"   dur="2.2s" begin="0.8s" repeatCount="indefinite" />
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
      <MapSVGRoutes />
    </MapContainer>
  );
}
