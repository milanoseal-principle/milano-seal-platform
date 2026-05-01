"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const GEO_URL = "/world-110m.json";

type Position = { coordinates: [number, number]; zoom: number };

const REGION_PRESETS: Record<string, Position> = {
  europe: { coordinates: [15, 50], zoom: 3 },
  americas: { coordinates: [-80, 10], zoom: 2 },
  asia: { coordinates: [100, 25], zoom: 2.5 },
};

function getDestination(geoName: string): Destination | undefined {
  return DESTINATIONS.find(
    (d) => d.name.toLowerCase() === geoName.toLowerCase()
  );
}

export function GlobalIntelMapInteractive() {
  const [active, setActive] = useState<Destination | null>(null);
  const [position, setPosition] = useState<Position>({
    coordinates: [0, 20],
    zoom: 1,
  });

  return (
    <div className="relative w-full bg-[#0A0A0A] border-y border-[#141414] overflow-hidden">
      {/* Region quick nav */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {Object.entries(REGION_PRESETS).map(([key, pos]) => (
          <button
            key={key}
            onClick={() => setPosition(pos)}
            className="px-3 py-1.5 bg-[#111111] border border-[#2A2A2A] text-[#B0B0B0] text-[10px] tracking-[0.12em] uppercase rounded-lg hover:border-[#C6A55A] hover:text-[#C6A55A] transition-colors duration-200"
          >
            {key === "americas"
              ? "Americas"
              : key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="absolute top-4 right-4 z-10 text-[10px] text-[#3A3A3A] tracking-wider hidden md:block">
        Scroll to zoom · Click a country
      </div>

      <ComposableMap
        projectionConfig={{ scale: 160 }}
        style={{ width: "100%", height: "480px" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={(pos) => setPosition(pos as Position)}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name as string;
                const dest = getDestination(name);
                const isActive = active?.name === name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => dest && setActive(dest)}
                    style={{
                      default: {
                        fill: isActive
                          ? "#C6A55A"
                          : dest
                          ? "#1E1A14"
                          : "#0D0D0D",
                        stroke: "#1A1A1A",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: dest ? "pointer" : "default",
                      },
                      hover: {
                        fill: dest ? "#C6A55A" : "#141414",
                        stroke: "#2A2A2A",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: dest ? "pointer" : "default",
                      },
                      pressed: {
                        fill: "#D4BB7A",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Intelligence panel */}
      {active && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,0.8)] z-20">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{active.flag}</span>
              <div>
                <h3 className="font-serif text-xl text-white leading-tight">
                  {active.name}
                </h3>
                <span
                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${
                    active.hague
                      ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {active.hagueStatus}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActive(null)}
              className="p-1.5 hover:bg-[#1A1A1A] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[#8A8A8A]" />
            </button>
          </div>

          {/* Compliance badges */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3">
              <div className="text-[#8A8A8A] text-[10px] uppercase tracking-wider mb-1">
                Apostille
              </div>
              <div className="text-white text-xs font-medium">
                {active.apostilleRequired ? "Required" : "Not Required"}
              </div>
            </div>
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3">
              <div className="text-[#8A8A8A] text-[10px] uppercase tracking-wider mb-1">
                Convention
              </div>
              <div className="text-white text-xs font-medium">
                {active.hague ? "Hague Member" : "Non-Hague"}
              </div>
            </div>
          </div>

          {/* Note */}
          {active.note && (
            <p className="text-[#8A8A8A] text-xs mb-4 leading-relaxed">
              {active.note}
            </p>
          )}

          {/* Execution path */}
          <div className="border-t border-[#1A1A1A] pt-4 mb-5">
            <p className="text-[#C6A55A] text-[9px] tracking-[0.2em] uppercase font-semibold mb-3">
              Execution Path
            </p>
            <div className="space-y-1.5">
              {active.executionPath.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-[#B0B0B0]"
                >
                  <span className="text-[#C6A55A] flex-shrink-0 font-medium">
                    {i + 1}.
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href={`/intake?country=${encodeURIComponent(active.name)}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
          >
            Begin Execution for {active.name}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
