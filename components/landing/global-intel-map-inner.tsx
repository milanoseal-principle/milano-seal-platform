"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DESTINATIONS, type Destination } from "@/data/destinations";

interface FlyToTarget {
  lat: number;
  lng: number;
  zoom: number;
}

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

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    fetch("/world.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (geoLayerRef.current) {
          map.removeLayer(geoLayerRef.current);
        }

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
              if (activeRef.current?.name !== name) {
                path.setStyle({ fillColor: "#1E1A14", fillOpacity: 1 });
              }
            });
            path.on("click", () => {
              setActive(dest);
            });
          },
        });

        layer.addTo(map);
        geoLayerRef.current = layer;
      });

    return () => {
      if (geoLayerRef.current) {
        map.removeLayer(geoLayerRef.current);
        geoLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((featureLayer) => {
      const l = featureLayer as L.Path & { feature?: GeoJSON.Feature };
      const name = (l.feature?.properties?.name as string) ?? "";
      l.setStyle(countryStyle(name, active?.name === name));
    });
  }, [active]);

  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom, {
        duration: 0.8,
      });
    }
  }, [flyTarget, map]);

  return null;
}

// ── Cinematic SVG filament overlay ─────────────────────────────────────────

const ROUTE_DESTS = [
  { name: "Italy",  lat: 41.9028, lng: 12.4964  },
  { name: "Spain",  lat: 40.4168, lng: -3.7038  },
  { name: "Brazil", lat: -14.235, lng: -51.9253 },
  { name: "UAE",    lat: 23.4241, lng: 53.8478  },
];
const ORIGIN_LL: [number, number] = [25.7617, -80.1918];

function arcD(ox: number, oy: number, dx: number, dy: number): string {
  const mx = (ox + dx) / 2;
  const my = (oy + dy) / 2 - Math.abs(dx - ox) * 0.22;
  return `M ${ox.toFixed(1)} ${oy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`;
}

function MapSVGRoutes() {
  const map = useMap();
  const [, bump] = useState(0);

  useEffect(() => {
    const tick = () => bump((n) => n + 1);
    map.on("move", tick);
    map.on("zoom", tick);
    map.on("resize", tick);
    return () => {
      map.off("move", tick);
      map.off("zoom", tick);
      map.off("resize", tick);
    };
  }, [map]);

  const sz = map.getSize();
  const op = map.latLngToContainerPoint(ORIGIN_LL);

  const routes = ROUTE_DESTS.map((d, i) => ({
    ...d,
    pt:    map.latLngToContainerPoint([d.lat, d.lng]),
    dur:   (2.6 + i * 0.28).toFixed(2),
    delay: (i * 0.44).toFixed(2),
  }));

  const overlay = (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: sz.x,
        height: sz.y,
        pointerEvents: "none",
        zIndex: 500,
        overflow: "visible",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <defs>
        {/* Outer atmospheric bloom — pure blur */}
        <filter id="ms-arc-bloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
        {/* Node dot glow — blur behind source */}
        <filter id="ms-dot-bloom" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {routes.map((r) => {
        const d    = arcD(op.x, op.y, r.pt.x, r.pt.y);
        const d2dur = (parseFloat(r.dur) * 0.72).toFixed(2);
        const d2del = (parseFloat(r.delay) + 0.55).toFixed(2);
        return (
          <g
            key={r.name}
            style={{
              transform: "translateZ(0)",
              willChange: "transform, opacity",
            }}
          >
            {/* Layer 3 — outer atmospheric bloom */}
            <path d={d} fill="none" stroke="#D4AF37" strokeWidth="7"  opacity="0.14" filter="url(#ms-arc-bloom)" />
            {/* Layer 2 — inner screen glow */}
            <path
              d={d}
              fill="none"
              stroke="#D4AF37"
              strokeWidth="3"
              opacity="0.42"
              style={{ mixBlendMode: "screen" as React.CSSProperties["mixBlendMode"] }}
            />
            {/* Layer 1 — champagne core filament with traveling dash */}
            <path
              d={d}
              fill="none"
              stroke="#F4E5B8"
              strokeWidth="1"
              opacity="0.82"
              strokeDasharray="8 5"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-26"
                dur={`${r.dur}s`}
                repeatCount="indefinite"
              />
            </path>

            {/* Ripple ring 1 — dampened cubic-bezier expand */}
            <circle cx={r.pt.x} cy={r.pt.y} r="4" fill="none" stroke="#C6A55A" strokeWidth="1">
              <animate
                attributeName="r"
                values="4;24"
                dur={`${r.dur}s`}
                begin={`${r.delay}s`}
                calcMode="spline"
                keySplines="0.16 1 0.3 1"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.75;0"
                dur={`${r.dur}s`}
                begin={`${r.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Ripple ring 2 — offset phase */}
            <circle cx={r.pt.x} cy={r.pt.y} r="4" fill="none" stroke="#C6A55A" strokeWidth="0.6">
              <animate
                attributeName="r"
                values="4;18"
                dur={`${d2dur}s`}
                begin={`${d2del}s`}
                calcMode="spline"
                keySplines="0.16 1 0.3 1"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0"
                dur={`${d2dur}s`}
                begin={`${d2del}s`}
                repeatCount="indefinite"
              />
            </circle>
            {/* Core node dot */}
            <circle
              cx={r.pt.x}
              cy={r.pt.y}
              r="3.5"
              fill="#D4AF37"
              filter="url(#ms-dot-bloom)"
              style={{ willChange: "opacity" }}
            >
              <animate
                attributeName="opacity"
                values="1;0.5;1"
                dur="2.1s"
                begin={`${r.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}

      {/* Florida origin pulse */}
      <g style={{ transform: "translateZ(0)" }}>
        <circle cx={op.x} cy={op.y} r="5" fill="none" stroke="#F4E5B8" strokeWidth="1.2">
          <animate attributeName="r"       values="5;20"    dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.85;0"  dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={op.x} cy={op.y} r="4.5" fill="#F4E5B8" filter="url(#ms-dot-bloom)" />
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
