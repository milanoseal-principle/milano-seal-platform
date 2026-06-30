"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plane, Package } from "lucide-react";

export function CourierTrackerMotion({ progress, active }: { progress: number; active: boolean }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const pkgRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (!pathRef.current || !pkgRef.current || !active) return;
    const path = pathRef.current;
    const length = path.getTotalLength();
    const point = path.getPointAtLength((progress / 100) * length);
    pkgRef.current.setAttribute("transform", `translate(${point.x}, ${point.y})`);
  }, [progress, active]);

  const checkpoints = [
    { x: 30, y: 75, label: "Florida", passed: progress > 0 },
    { x: 130, y: 55, label: "DHL Hub", passed: progress > 30 },
    { x: 240, y: 50, label: "Customs", passed: progress > 60 },
    { x: 340, y: 75, label: "Delivery", passed: progress > 95 },
  ];

  return (
    <div className="glass-sovereign rounded-sm p-5 metallic-edge relative h-[420px] flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/10">
        <div className="flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[10px] font-mono text-gray-400 tracking-[0.25em] uppercase">Active Courier Channel</span>
        </div>
        <span className="text-[10px] font-mono text-[#D4AF37]">DHL EXPRESS</span>
      </div>

      {active ? (
        <>
          <div className="relative bg-[#050507] rounded-sm border border-[#D4AF37]/10 mb-4 flex-1">
            <svg viewBox="0 0 380 130" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="ms-blueGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path ref={pathRef} d="M 30 75 Q 130 55, 240 50 Q 340 55, 340 75" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.45" />
              <path d="M 30 75 Q 130 55, 240 50 Q 340 55, 340 75" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.85" strokeDasharray="500" strokeDashoffset={500 - progress * 5} filter="url(#ms-blueGlow)" />
              {checkpoints.map((c) => (
                <g key={c.label} transform={`translate(${c.x}, ${c.y})`}>
                  <motion.circle r="5" fill={c.passed ? "#10B981" : "#374151"} stroke={c.passed ? "#10B981" : "#4B5563"} strokeWidth="1.5" animate={{ scale: c.passed ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.4 }} />
                  <text y="18" fontSize="8" fill={c.passed ? "#10B981" : "#6B7280"} textAnchor="middle" fontWeight="600">{c.label}</text>
                </g>
              ))}
              <g ref={pkgRef}>
                <circle r="8" fill="rgba(59,130,246,.3)" stroke="#3B82F6" strokeWidth="1.8" filter="url(#ms-blueGlow)" />
                <rect x="-4" y="-4" width="8" height="8" fill="#3B82F6" rx="1.5" />
              </g>
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-auto">
            <CourierMetric label="Progress" value={`${Math.floor(progress)}%`} tone="blue" />
            <CourierMetric label="ETA" value={progress < 100 ? `${Math.ceil((100 - progress) / 20)}h` : "ARRIVED"} />
            <CourierMetric label="Status" value={progress < 100 ? "TRANSIT" : "DELIVERED"} tone="blue" />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Package className="w-8 h-8 mb-2 opacity-40" />
          <div className="text-[10px] font-mono tracking-wider uppercase">Awaiting Dispatch Authorization</div>
        </div>
      )}
    </div>
  );
}

function CourierMetric({ label, value, tone = "gold" }: { label: string; value: string; tone?: "gold" | "blue" }) {
  const color = tone === "blue" ? "text-blue-400" : "text-[#D4AF37]";
  return (
    <div className="bg-black/40 border border-[#D4AF37]/10 rounded-sm p-2.5 text-center">
      <div className="text-[8px] text-gray-500 uppercase tracking-[0.3em] mb-1">{label}</div>
      <div className={`text-sm font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}
