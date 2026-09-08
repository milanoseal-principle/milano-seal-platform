"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { type Destination } from "@/data/destinations";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const COUNTRY_PAGES = new Set(["italy", "spain", "germany", "portugal", "uae", "mexico"]);
function countryPath(slug: string) {
  return COUNTRY_PAGES.has(slug) ? `/apostille/${slug}` : `/apostille/${slug}`;
}

const MapInner = dynamic(() => import("./global-intel-map-inner"), {
  ssr: false,
  loading: () => <div style={{ height: "480px" }} className="bg-[#0A0A0A]" />,
});

interface FlyToTarget {
  lat: number;
  lng: number;
  zoom: number;
}

const REGION_PRESETS: Record<string, FlyToTarget> = {
  europe: { lat: 50, lng: 15, zoom: 4 },
  americas: { lat: 10, lng: -80, zoom: 3 },
  asia: { lat: 25, lng: 100, zoom: 4 },
};

type AtmospherePalette = readonly [string, string, string];

const DESTINATION_ATMOSPHERES: Record<string, AtmospherePalette> = {
  Italy: ["#009246", "#ffffff", "#ce2b37"],
  Spain: ["#aa151b", "#f1bf00", "#aa151b"],
  Greece: ["#0d5eaf", "#ffffff", "#0d5eaf"],
  Argentina: ["#74acdf", "#ffffff", "#74acdf"],
  Colombia: ["#fcd116", "#003893", "#ce1126"],
  Mexico: ["#006847", "#ffffff", "#ce1126"],
  Portugal: ["#046a38", "#ffcc00", "#da291c"],
  France: ["#0055a4", "#ffffff", "#ef4135"],
  Germany: ["#111111", "#dd0000", "#ffce00"],
  Belgium: ["#111111", "#ffd90c", "#ef3340"],
  Netherlands: ["#ae1c28", "#ffffff", "#21468b"],
  Austria: ["#ed2939", "#ffffff", "#ed2939"],
  Switzerland: ["#d52b1e", "#ffffff", "#d52b1e"],
  Poland: ["#ffffff", "#dc143c", "#dc143c"],
  Romania: ["#002b7f", "#fcd116", "#ce1126"],
  Turkey: ["#e30a17", "#ffffff", "#e30a17"],
  Sweden: ["#006aa7", "#fecc00", "#006aa7"],
  Norway: ["#ba0c2f", "#ffffff", "#00205b"],
  "United Kingdom": ["#012169", "#ffffff", "#c8102e"],
  Brazil: ["#009c3b", "#ffdf00", "#002776"],
  Chile: ["#0039a6", "#ffffff", "#d52b1e"],
  Uruguay: ["#5bbad5", "#ffffff", "#fcd116"],
  Peru: ["#d91023", "#ffffff", "#d91023"],
  Ecuador: ["#ffdd00", "#034ea2", "#ed1c24"],
  Venezuela: ["#ffcc00", "#00247d", "#cf142b"],
  Panama: ["#005293", "#ffffff", "#d21034"],
  "Dominican Republic": ["#002d62", "#ffffff", "#ce1126"],
  Morocco: ["#c1272d", "#006233", "#c1272d"],
  Israel: ["#0038b8", "#ffffff", "#0038b8"],
  UAE: ["#00732f", "#ffffff", "#000000"],
  "United Arab Emirates": ["#00732f", "#ffffff", "#000000"],
  India: ["#ff9933", "#ffffff", "#138808"],
  Japan: ["#ffffff", "#bc002d", "#ffffff"],
  "South Korea": ["#ffffff", "#cd2e3a", "#0047a0"],
  Philippines: ["#0038a8", "#fcd116", "#ce1126"],
  Australia: ["#012169", "#ffffff", "#e4002b"],
  "New Zealand": ["#00247d", "#ffffff", "#cc142b"],
  Singapore: ["#ef3340", "#ffffff", "#ef3340"],
  "South Africa": ["#007749", "#ffb81c", "#001489"],
  Senegal: ["#00853f", "#fdef42", "#e31b23"],
  Mauritius: ["#ea2839", "#1a206d", "#00a551"],
  Canada: ["#d80621", "#ffffff", "#d80621"],
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  const parsed = Number.parseInt(value, 16);
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function atmosphereBackground(name: string) {
  const [primary, middle, secondary] = DESTINATION_ATMOSPHERES[name] ?? ["#c6a55a", "#ffffff", "#8c7441"];
  return [
    `radial-gradient(ellipse at 72% 48%, ${hexToRgba(middle, 0.085)} 0%, ${hexToRgba(middle, 0.035)} 31%, transparent 68%)`,
    `radial-gradient(ellipse at 58% 56%, ${hexToRgba(primary, 0.105)} 0%, ${hexToRgba(primary, 0.045)} 34%, transparent 72%)`,
    `radial-gradient(ellipse at 88% 44%, ${hexToRgba(secondary, 0.11)} 0%, ${hexToRgba(secondary, 0.045)} 36%, transparent 74%)`,
    `linear-gradient(105deg, ${hexToRgba(primary, 0.075)} 0%, ${hexToRgba(primary, 0.035)} 29%, ${hexToRgba(middle, 0.03)} 49%, ${hexToRgba(secondary, 0.04)} 69%, ${hexToRgba(secondary, 0.08)} 100%)`,
  ].join(", ");
}

interface AtmosphereLayer {
  id: string;
  country: string;
  exiting: boolean;
}

function DestinationAtmosphere({ active }: { active: Destination | null }) {
  const [layers, setLayers] = useState<AtmosphereLayer[]>([]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const country = active?.name;
    const id = active?.slug;

    setLayers((current) => {
      const outgoing = current.map((layer) => ({ ...layer, exiting: true }));
      if (!country || !id) return outgoing;
      return [
        ...outgoing.filter((layer) => layer.id !== id),
        { id, country, exiting: false },
      ];
    });

    const timer = window.setTimeout(() => {
      setLayers((current) => current.filter((layer) => !layer.exiting));
    }, 1350);
    timersRef.current.push(timer);

    return () => {
      timersRef.current.forEach((pending) => window.clearTimeout(pending));
      timersRef.current = [];
    };
  }, [active?.name, active?.slug]);

  if (layers.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 350 }} aria-hidden="true">
      {layers.map((layer) => (
        <div
          key={`${layer.id}-${layer.exiting ? "out" : "in"}`}
          className={layer.exiting ? "ms-destination-atmosphere ms-destination-atmosphere-out" : "ms-destination-atmosphere ms-destination-atmosphere-in"}
          style={{ background: atmosphereBackground(layer.country) }}
        />
      ))}
    </div>
  );
}

interface Props {
  onSelect?: (dest: Destination | null) => void;
  selectedDest?: Destination | null;
  externalFlyTarget?: FlyToTarget | null;
}

export function GlobalIntelMapInteractive({ onSelect, selectedDest, externalFlyTarget }: Props = {}) {
  const [internalActive, setInternalActive] = useState<Destination | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyToTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalFlyTarget) setFlyTarget({ ...externalFlyTarget });
  }, [externalFlyTarget]);

  // A selected destination is authoritative UI state. This also handles the
  // homepage → /map?country=portugal handoff: when GlobalMap resolves the query
  // into selectedDest, the full Atlas flies to that same country instead of
  // opening at a generic world view.
  useEffect(() => {
    if (!selectedDest?.lat || !selectedDest?.lng) return;
    setFlyTarget({ lat: selectedDest.lat, lng: selectedDest.lng, zoom: 5 });
  }, [selectedDest?.slug, selectedDest?.lat, selectedDest?.lng]);

  // When parent provides onSelect, use parent's state; otherwise manage internally
  const active = onSelect ? (selectedDest ?? null) : internalActive;
  const setActive = onSelect ?? setInternalActive;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--mouse-y", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#0A0A0A] overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .ms-destination-atmosphere {
          position: absolute;
          inset: -18%;
          border-radius: 42%;
          pointer-events: none;
          mix-blend-mode: screen;
          transform-origin: 72% 50%;
          will-change: opacity, transform, filter;
        }
        .ms-destination-atmosphere-in {
          animation: msDestinationAtmosphereIn 4.6s cubic-bezier(.18,.74,.18,1) both;
        }
        .ms-destination-atmosphere-out {
          animation: msDestinationAtmosphereOut 1.25s ease-out both;
        }
        @keyframes msDestinationAtmosphereIn {
          0% {
            opacity: 0;
            transform: scale(.92) translate3d(8%,0,0);
            filter: blur(52px) saturate(.70);
          }
          45% { opacity: .09; }
          100% {
            opacity: .14;
            transform: scale(1.16) translate3d(0,0,0);
            filter: blur(28px) saturate(.80);
          }
        }
        @keyframes msDestinationAtmosphereOut {
          0% {
            opacity: .14;
            transform: scale(1.16) translate3d(0,0,0);
            filter: blur(28px) saturate(.80);
          }
          100% {
            opacity: 0;
            transform: scale(1.22) translate3d(-3%,0,0);
            filter: blur(46px) saturate(.68);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ms-destination-atmosphere-in,
          .ms-destination-atmosphere-out {
            animation: none !important;
          }
          .ms-destination-atmosphere-in {
            opacity: .12;
            transform: scale(1.12);
            filter: blur(30px) saturate(.78);
          }
          .ms-destination-atmosphere-out { display: none; }
        }
      `}</style>

      <DestinationAtmosphere active={active} />
      <div className="map-vault-glow absolute inset-0 pointer-events-none" style={{ zIndex: 499 }} />

      <div className="absolute top-4 left-4 flex gap-2 z-[1000]">
        {Object.entries(REGION_PRESETS).map(([key, pos]) => (
          <button
            key={key}
            onClick={() => setFlyTarget({ ...pos })}
            className="px-3 py-1.5 bg-[#111111] border border-[#2A2A2A] text-[#B0B0B0] text-[10px] tracking-[0.12em] uppercase rounded-lg hover:border-[#C6A55A] hover:text-[#C6A55A] transition-colors duration-200"
          >
            {key === "americas" ? "Americas" : key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div className="absolute top-4 right-4 z-[1000] text-[10px] text-[#3A3A3A] tracking-wider hidden md:block">
        Scroll to zoom · Click a country
      </div>

      <MapInner active={active} setActive={setActive} flyTarget={flyTarget} />

      {!onSelect && active && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.8)] z-[1001]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{active.flag}</span>
              <div>
                <h3 className="font-serif text-xl text-white leading-tight">{active.name}</h3>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${active.hague ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {active.hagueStatus}
                </span>
              </div>
            </div>
            <button onClick={() => setActive(null)} className="p-1.5 hover:bg-[#1A1A1A] rounded-lg transition-colors">
              <X className="w-4 h-4 text-[#8A8A8A]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3">
              <div className="text-[#8A8A8A] text-[10px] uppercase tracking-wider mb-1">Apostille</div>
              <div className="text-white text-xs font-medium">{active.apostilleRequired ? "Required" : "Not Required"}</div>
            </div>
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3">
              <div className="text-[#8A8A8A] text-[10px] uppercase tracking-wider mb-1">Convention</div>
              <div className="text-white text-xs font-medium">{active.hague ? "Hague Member" : "Non-Hague"}</div>
            </div>
          </div>

          {active.note && <p className="text-[#8A8A8A] text-xs mb-4 leading-relaxed">{active.note}</p>}

          <div className="border-t border-[#1A1A1A] pt-4 mb-5">
            <p className="text-[#C6A55A] text-[9px] tracking-[0.08em] uppercase font-semibold mb-3">Execution Path</p>
            <div className="space-y-1.5">
              {active.executionPath.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#B0B0B0]">
                  <span className="text-[#C6A55A] flex-shrink-0 font-medium">{i + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/intake?country=${encodeURIComponent(active.name)}`} className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200">
              Begin Secure Intake for {active.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={countryPath(active.slug)} className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#2A2A2A] text-[#8A8A8A] text-xs rounded-xl hover:border-[#C6A55A]/40 hover:text-[#C6A55A] transition-all duration-300">
              View {active.name} Requirements
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
