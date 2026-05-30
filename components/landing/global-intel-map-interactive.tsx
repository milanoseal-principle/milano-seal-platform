"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { type Destination } from "@/data/destinations";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

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

interface Props {
  onSelect?: (dest: Destination | null) => void;
  selectedDest?: Destination | null;
}

export function GlobalIntelMapInteractive({ onSelect, selectedDest }: Props = {}) {
  const [internalActive, setInternalActive] = useState<Destination | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyToTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When parent provides onSelect, use parent's state; otherwise manage internally
  const active = onSelect ? (selectedDest ?? null) : internalActive;
  const setActive = onSelect ?? setInternalActive;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--mouse-y", `${(((e.clientY - r.top)  / r.height) * 100).toFixed(1)}%`);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#0A0A0A] overflow-hidden"
      className="relative w-full bg-[#0A0A0A] border-y border-[#141414] overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Mouse-tracked gold light leak */}
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

      {/* Internal centered modal — only renders when NOT controlled by parent (standalone use) */}
      {!onSelect && active && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.8)] z-[1001]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{active.flag}</span>
              <div>
                <h3 className="font-serif text-xl text-white leading-tight">{active.name}</h3>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${
                  active.hague ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                }`}>
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

          {active.note && (
            <p className="text-[#8A8A8A] text-xs mb-4 leading-relaxed">{active.note}</p>
          )}

          <div className="border-t border-[#1A1A1A] pt-4 mb-5">
            <p className="text-[#C6A55A] text-[9px] tracking-[0.2em] uppercase font-semibold mb-3">Execution Path</p>
            <div className="space-y-1.5">
              {active.executionPath.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#B0B0B0]">
                  <span className="text-[#C6A55A] flex-shrink-0 font-medium">{i + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <Link
            href={`/intake?country=${encodeURIComponent(active.name)}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
          >
            Begin Secure Intake for {active.name}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
