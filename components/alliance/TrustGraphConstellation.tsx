"use client";

import { motion } from "framer-motion";

export interface TrustNode {
  id: string;
  name: string;
  role: string;
  score: number;
  coordinates: { x: number; y: number };
  approved: boolean;
  verified: boolean;
  total_assignments: number;
  completed_assignments: number;
}

const KINEMATIC_EASE = [0.1, 0.9, 0.2, 1] as const;

function ScoreBar({ score, delay }: { score: number; delay: number }) {
  return (
    <div className="mt-2" style={{ height: 1, background: "rgba(255,255,255,0.04)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ ease: KINEMATIC_EASE, duration: 0.9, delay }}
        style={{
          height: 1,
          background: score >= 80 ? "#d4af37" : "rgba(212,175,55,0.3)",
        }}
      />
    </div>
  );
}

export function TrustGraphConstellation({ nodes }: { nodes: TrustNode[] }) {
  return (
    <div
      className="relative w-full overflow-hidden select-none rounded-sm"
      style={{
        height: 540,
        background: "#020101",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Micro-grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.015) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, #000 100%)",
        }}
      />

      {/* Header */}
      <div className="absolute top-5 left-5 z-10">
        <span
          className="block text-[9px] font-mono tracking-[0.38em] mb-1"
          style={{ color: "rgba(212,175,55,0.45)" }}
        >
          INTELLIGENCE BACKBONE
        </span>
        <h3
          className="text-sm font-light tracking-wider"
          style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-playfair),Georgia,serif" }}
        >
          THE GLOBAL TRUST GRAPH™
        </h3>
      </div>

      <div className="absolute top-5 right-5 z-10">
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
          {nodes.length} VERIFIED NODES
        </span>
      </div>

      {/* SVG connector rails */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.map((node, i) =>
          nodes[i + 1] ? (
            <motion.line
              key={`rail-${node.id}`}
              x1={`${node.coordinates.x}%`}
              y1={`${node.coordinates.y}%`}
              x2={`${nodes[i + 1].coordinates.x}%`}
              y2={`${nodes[i + 1].coordinates.y}%`}
              stroke="rgba(212,175,55,0.08)"
              strokeWidth={0.75}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ ease: KINEMATIC_EASE, duration: 1.2, delay: i * 0.06 }}
            />
          ) : null,
        )}
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => (
        <motion.div
          key={node.id}
          style={{
            position: "absolute",
            top: `${node.coordinates.y}%`,
            left: `${node.coordinates.x}%`,
            transform: "translate(-50%,-50%)",
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ease: KINEMATIC_EASE, duration: 0.75, delay: index * 0.045 }}
        >
          <div
            className="rounded-sm cursor-crosshair"
            style={{
              background: "rgba(8,5,1,0.94)",
              border: `1px solid ${node.score >= 95 ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.07)"}`,
              padding: "10px 12px",
              minWidth: 118,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {/* Status dot */}
              <div className="relative flex-shrink-0">
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ background: node.approved ? "#d4af37" : "rgba(107,114,128,0.45)" }}
                />
                {node.score >= 85 && (
                  <motion.span
                    animate={{ opacity: [0.15, 0.65, 0.15], scale: [1, 1.7, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(212,175,55,0.35)" }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className="text-[10px] font-medium tracking-wide truncate"
                  style={{ color: "rgba(255,255,255,0.75)", maxWidth: 90 }}
                >
                  {node.name}
                </div>
                <div
                  className="text-[8px] font-mono tracking-widest uppercase mt-0.5"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {node.role}
                </div>
              </div>
            </div>

            <ScoreBar score={node.score} delay={index * 0.05 + 0.35} />

            <div className="mt-1 flex items-center justify-between">
              <span
                className="text-[8px] font-mono"
                style={{ color: "rgba(212,175,55,0.55)" }}
              >
                {node.score}/100
              </span>
              {node.total_assignments > 0 && (
                <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {node.completed_assignments}/{node.total_assignments}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-[10px] font-mono tracking-[0.25em] mb-1"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              NO VERIFIED NODES
            </div>
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.1)" }}>
              Operator profiles populate this graph upon verification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
