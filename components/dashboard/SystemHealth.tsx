"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { HealthScore } from "@/app/dashboard/truth/page";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "#ef4444";
const AMBER = "#f59e0b";

function labelColor(label: HealthScore["label"]): string {
  switch (label) {
    case "STRONG": return EMERALD;
    case "GOOD": return GOLD;
    case "DEVELOPING": return AMBER;
    case "EARLY": return "rgba(255,255,255,0.4)";
    case "CRITICAL": return RED;
  }
}

function scoreColor(score: number): string {
  if (score >= 70) return EMERALD;
  if (score >= 50) return AMBER;
  return RED;
}

function overallLabel(score: number): string {
  if (score >= 70) return "SYSTEM NOMINAL";
  if (score >= 50) return "ATTENTION REQUIRED";
  return "CRITICAL STATE";
}

function HealthCard({
  score,
  index,
}: {
  score: HealthScore;
  index: number;
}) {
  const [barWidth, setBarWidth] = useState(0);
  const color = labelColor(score.label);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidth(score.score);
    }, 200 + index * 80);
    return () => clearTimeout(timer);
  }, [score.score, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: 0.1 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 8,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Category + score row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            lineHeight: 1.4,
          }}
        >
          {score.category}
        </p>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 32,
            fontWeight: 700,
            color: labelColor(score.label),
            lineHeight: 1,
          }}
        >
          {score.score}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barWidth}%`,
            background: color,
            borderRadius: 2,
            transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* Label badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: color,
            padding: "2px 8px",
            border: `1px solid ${color}`,
            borderRadius: 3,
            opacity: 0.85,
          }}
        >
          {score.label}
        </span>
        <Link
          href={score.route}
          style={{
            color: "rgba(198,165,90,0.5)",
            fontSize: 10,
            fontFamily: "monospace",
            textDecoration: "none",
          }}
        >
          →
        </Link>
      </div>

      {/* Note */}
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {score.note}
      </p>
    </motion.div>
  );
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export function SystemHealth({
  scores,
  overallScore,
}: {
  scores: HealthScore[];
  overallScore: number;
}) {
  const displayed = useCountUp(overallScore, 800);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        padding: "32px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 8,
          }}
        >
          Milano Seal System Health
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 6,
          }}
        >
          Truth Engine
        </h1>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {today}
        </p>
      </div>

      {/* Overall truth score */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 56,
          padding: "48px 24px",
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 12,
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 16,
          }}
        >
          Overall Truth Score
        </p>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 72,
            fontWeight: 700,
            color: scoreColor(overallScore),
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          {displayed}
        </div>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: scoreColor(overallScore),
          }}
        >
          {overallLabel(overallScore)}
        </p>
      </div>

      {/* Health category grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 48,
        }}
      >
        {scores.map((score, i) => (
          <HealthCard key={score.category} score={score} index={i} />
        ))}
      </div>

      {/* Truth statement */}
      <div
        style={{
          padding: "20px 24px",
          borderTop: "1px solid rgba(212,175,55,0.06)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            lineHeight: 1.7,
            maxWidth: 720,
          }}
        >
          Health scores are calculated from real platform data. Deployment Health requires manual
          operator verification. Scores improve as matters close, authorities are verified, and
          partners are confirmed.
        </p>
      </div>
    </motion.div>
  );
}
