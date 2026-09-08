"use client";

import { useEffect, useId, useRef, useState } from "react";
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
    fillOpacity: isActive ? 0.24 : 1,
    color: isActive ? "#D4AF37" : "#1A1A1A",
    weight: isActive ? 1.6 : 0.5,
    className: isActive ? "ms-selected-territory" : undefined,
  };
}

const FLAG_GRADIENTS: Record<string, string> = {
  Italy: "linear-gradient(90deg,#009246 0 33%,#fff 33% 66%,#ce2b37 66%)",
  Spain: "linear-gradient(#aa151b 0 25%,#f1bf00 25% 75%,#aa151b 75%)",
  Greece: "repeating-linear-gradient(#0d5eaf 0 11%,#fff 11% 22%)",
  Argentina: "linear-gradient(#74acdf 0 33%,#fff 33% 66%,#74acdf 66%)",
  Colombia: "linear-gradient(#fcd116 0 50%,#003893 50% 75%,#ce1126 75%)",
};

const FLAG_BANDS: Record<string, { direction: "horizontal" | "vertical"; colors: string[]; sizes?: number[] }> = {
  Italy: { direction: "vertical", colors: ["#009246", "#ffffff", "#ce2b37"] },
  Spain: { direction: "horizontal", colors: ["#aa151b", "#f1bf00", "#aa151b"], sizes: [25, 50, 25] },
  Greece: { direction: "horizontal", colors: ["#0d5eaf", "#ffffff", "#0d5eaf", "#ffffff", "#0d5eaf", "#ffffff", "#0d5eaf", "#ffffff", "#0d5eaf"] },
  Argentina: { direction: "horizontal", colors: ["#74acdf", "#ffffff", "#74acdf"] },
  Colombia: { direction: "horizontal", colors: ["#fcd116", "#003893", "#ce1126"], sizes: [50, 25, 25] },
};

function ensureFlagPattern(svg: SVGSVGElement, name: string) {
  const config = FLAG_BANDS[name];
  if (!config) return null;
  const id = `ms-flag-${name.toLowerCase().replace(/\W/g, "-")}`;
  if (svg.querySelector(`#${id}`)) return id;
  const ns = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(ns, "defs");
    svg.prepend(defs);
  }
  const pattern = document.createElementNS(ns, "pattern");
  pattern.setAttribute("id", id);
  pattern.setAttribute("width", "1");
  pattern.setAttribute("height", "1");
  pattern.setAttribute("patternContentUnits", "objectBoundingBox");
  let offset = 0;
  config.colors.forEach((color, index) => {
    const size = config.sizes?.[index] ?? 100 / config.colors.length;
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute(config.direction === "vertical" ? "x" : "y", String(offset / 100));
    rect.setAttribute(config.direction === "vertical" ? "width" : "height", String(size / 100));
    rect.setAttribute(config.direction === "vertical" ? "height" : "width", "1");
    rect.setAttribute("fill", color);
    pattern.appendChild(rect);
    offset += size;
  });
  defs.appendChild(pattern);
  return id;
}

function applyTerritoryIdentity(layer: L.Path, name: string, active: boolean) {
  const element = layer.getElement();
  if (!element) return;
  element.classList.toggle("ms-selected-territory", active);
  element.style.removeProperty("background");
  element.style.removeProperty("background-clip");
  if (active && FLAG_GRADIENTS[name]) {
    const patternId = element.ownerSVGElement && ensureFlagPattern(element.ownerSVGElement, name);
    if (patternId) {
      element.style.fill = `url(#${patternId})`;
      element.style.fillOpacity = "0.14";
    }
  } else {
    element.style.removeProperty("fill");
    element.style.removeProperty("fill-opacity");
  }
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
  const countryBoundsRef = useRef(new Map<string, L.LatLngBounds>());
  const transitionRef = useRef<number | null>(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/world.geojson", { signal: controller.signal })
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
            countryBoundsRef.current.set(name, featureLayer.getBounds());
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
            path.getElement()?.setAttribute("aria-label", `Select ${dest.name}`);
          },
        });
        layer.addTo(map);
        geoLayerRef.current = layer;
      });
    return () => {
      controller.abort();
      if (geoLayerRef.current) { map.removeLayer(geoLayerRef.current); geoLayerRef.current = null; }
    };
  }, [map]);

  useEffect(() => {
    if (!geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((fl) => {
      const l = fl as L.Path & { feature?: GeoJSON.Feature };
      const name = (l.feature?.properties?.name as string) ?? "";
      l.setStyle(countryStyle(name, active?.name === name));
      applyTerritoryIdentity(l, name, active?.name === name);
    });
  }, [active]);

  useEffect(() => {
    if (flyTarget) {
      map.stop();
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom, { duration: 0.8 });
    }
  }, [flyTarget, map]);

  // Fly to selected destination (prefer ROUTE_DESTS coords, fall back to Destination coords)
  useEffect(() => {
    if (!active) return;
    map.stop();
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
    const countryBounds = countryBoundsRef.current.get(active.name);
    const destination: L.LatLngExpression = [active.lat ?? countryBounds?.getCenter().lat ?? 0, active.lng ?? countryBounds?.getCenter().lng ?? 0];
    if (countryBounds) {
      map.flyToBounds(countryBounds, { padding: [70, 70], maxZoom: 5.25, duration: 0.82, easeLinearity: 0.24 });
    } else {
      map.flyTo(destination, 4.75, { duration: 0.82, easeLinearity: 0.24 });
    }
    transitionRef.current = window.setTimeout(() => {
      const corridor = L.latLngBounds([ORIGIN_LL, destination]);
      map.flyToBounds(corridor, { paddingTopLeft: [54, 72], paddingBottomRight: [54, 72], maxZoom: 4.4, duration: 0.9, easeLinearity: 0.24 });
      transitionRef.current = null;
    }, 1250);
    return () => {
      if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
      transitionRef.current = null;
      map.stop();
    };
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
  const routeId = useId().replace(/:/g, "");
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

      {/* A single traveler is keyed to the canonical destination. Replacing the
          group cancels rapid-switch animation rather than stacking loops. */}
      {active && (() => {
        const selected = routes.find((route) => route.name === active.name) ?? activeExtra;
        if (!selected) return null;
        const d = arcD(op.x, op.y, selected.pt.x, selected.pt.y, selected.spread);
        return (
          <g key={`traveler-${active.slug}-${routeId}`} className="ms-route-traveler" aria-hidden="true">
            <circle r="7" fill="#F4E5B8" opacity="0.18" filter="url(#ms-dot-glow)">
              <animateMotion dur="3.4s" repeatCount="indefinite" path={d} />
            </circle>
            <circle r="2.35" fill="#FFF8E3" filter="url(#ms-dot-glow)">
              <animateMotion dur="3.4s" repeatCount="indefinite" path={d} />
            </circle>
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
    <div className="relative min-h-[440px]">
      <style>{`
        .ms-selected-territory {
          filter: drop-shadow(0 0 5px rgba(212,175,55,.52));
          transition: fill .45s ease, stroke .45s ease, filter .45s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-route-traveler { display: none; }
          .leaflet-zoom-animated { transition-duration: .01ms !important; }
        }
      `}</style>
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
      {active && FLAG_GRADIENTS[active.name] && (
        <div
          className="pointer-events-none absolute bottom-4 right-4 z-[550] h-1.5 w-20 rounded-full opacity-[0.12] mix-blend-screen"
          style={{ background: FLAG_GRADIENTS[active.name] }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
