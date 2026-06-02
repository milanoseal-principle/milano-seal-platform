"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { TrustCounts } from "./page";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

interface RingMetric {
  label: string;
  count: number;
  target: number;
}

function TrustRing({
  metric,
  delay,
}: {
  metric: RingMetric;
  delay: number;
}) {
  const [progress, setProgress] = useState(0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(metric.count / metric.target, 1);
  const hasValue = metric.count > 0;
  const strokeColor = hasValue ? EMERALD : "rgba(255,255,255,0.08)";
  const trackColor = "rgba(255,255,255,0.06)";

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(ratio);
    }, 200 + delay);
    return () => clearTimeout(timer);
  }, [ratio, delay]);

  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          className="rotate-[-90deg]"
        >
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 800ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-lg font-semibold font-mono"
            style={{ color: hasValue ? GOLD : "rgba(255,255,255,0.2)" }}
          >
            {metric.count}
          </span>
        </div>
      </div>
      <p
        className="text-[10px] font-mono text-center uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.4)", maxWidth: 80 }}
      >
        {metric.label}
      </p>
    </div>
  );
}

export function TrustEngine({ counts }: { counts: TrustCounts }) {
  const metrics: RingMetric[] = [
    { label: "Verified Deliveries", count: counts.verifiedDeliveries, target: 500 },
    { label: "Verified Releases", count: counts.verifiedReleases, target: 500 },
    { label: "Verified Countries", count: counts.verifiedCountries, target: 50 },
    { label: "Verified Authorities", count: 0, target: 100 },
    { label: "Verified Corridors", count: 0, target: 100 },
    { label: "Verified Partners", count: 0, target: 50 },
  ];

  const MILESTONES = [
    {
      label: "First Verified Delivery",
      unlocked: counts.verifiedDeliveries > 0,
      detail: `${counts.verifiedDeliveries} deliveries recorded`,
    },
    {
      label: "10 Verified Releases",
      unlocked: counts.verifiedReleases >= 10,
      detail: `${counts.verifiedReleases} releases recorded`,
    },
    {
      label: "5 Verified Countries",
      unlocked: counts.verifiedCountries >= 5,
      detail: `${counts.verifiedCountries} countries served`,
    },
    {
      label: "First Verified Authority",
      unlocked: false,
      detail: "Awaiting AOC promotion",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen p-6 space-y-8"
      style={{ background: "#0A0A0A" }}
    >
      {/* Header */}
      <div>
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-2"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Intelligence / Trust Engine
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: GOLD }}>
          Milano Seal Trust Engine 3.0
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Verified delivery and authority trust metrics
        </p>
      </div>

      {/* Trust Growth Rings */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-8"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Trust Growth Rings
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          {metrics.map((metric, i) => (
            <TrustRing key={metric.label} metric={metric} delay={i * 80} />
          ))}
        </div>
      </div>

      {/* Trust Milestones */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Trust Milestones
        </p>
        <div className="space-y-2">
          {MILESTONES.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.04, duration: 0.3 }}
              className="flex items-center gap-4 p-3 rounded"
              style={{
                background: m.unlocked
                  ? "rgba(198,165,90,0.05)"
                  : "rgba(255,255,255,0.02)",
                borderLeft: `3px solid ${
                  m.unlocked ? GOLD : "rgba(255,255,255,0.08)"
                }`,
              }}
            >
              <span className="text-lg">{m.unlocked ? "✦" : "○"}</span>
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: m.unlocked
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.3)",
                  }}
                >
                  {m.label}
                </p>
                <p
                  className="text-[11px] font-mono mt-0.5"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {m.detail}
                </p>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  background: m.unlocked
                    ? `${GOLD}15`
                    : "rgba(255,255,255,0.04)",
                  color: m.unlocked ? GOLD : "rgba(255,255,255,0.2)",
                }}
              >
                {m.unlocked ? "Unlocked" : "Locked"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Statement */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "rgba(198,165,90,0.04)",
          border: "1px solid rgba(198,165,90,0.12)",
        }}
      >
        <p className="text-xs font-mono" style={{ color: "rgba(198,165,90,0.7)" }}>
          Trust metrics are derived exclusively from completed, verified matter
          records. No estimated or projected values are displayed.
        </p>
      </div>
    </motion.div>
  );
}
