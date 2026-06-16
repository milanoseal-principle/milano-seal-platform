"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export type MilanoOrbitMode =
  | "hero"
  | "dashboard"
  | "portal"
  | "launcher"
  | "release"
  | "trust";

export type MilanoOrbitState =
  | "idle"
  | "hover"
  | "active"
  | "verified"
  | "warning"
  | "blocked"
  | "released"
  | "loading"
  | "chat-open"
  | "page-hero";

// Legacy pipeline states — kept for backward compat
export type OrbitState =
  | "idle"
  | "intake_received"
  | "under_review"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "in_transit"
  | "delivered"
  | "completed";

export type OrbitMode = MilanoOrbitMode | "compact" | "trust";

export type MilanoOrbitSegment = {
  id: string;
  label: string;
  value?: number;
  state?: MilanoOrbitState;
};

type MilanoSealOrbitCoreProps = {
  mode?: MilanoOrbitMode | OrbitMode;
  state?: MilanoOrbitState | OrbitState;
  size?: "sm" | "md" | "lg" | "xl" | number;
  interactive?: boolean;
  showHalo?: boolean;
  showRouteArcs?: boolean;
  showNodes?: boolean;
  showDataSegments?: boolean;
  showLabel?: boolean;
  segments?: MilanoOrbitSegment[];
  label?: string;
  className?: string;
  crestSrc?: string;
  onClick?: () => void;
};

const CREST_SRC = "/milano-seal-orb-v2.png";

const INTERACTION_STATES = new Set<string>([
  "idle", "hover", "active", "verified", "warning",
  "blocked", "released", "loading", "chat-open", "page-hero",
]);

function toInteractionState(state: string): MilanoOrbitState {
  if (INTERACTION_STATES.has(state)) return state as MilanoOrbitState;
  // Map legacy pipeline states → interaction states
  const map: Record<string, MilanoOrbitState> = {
    intake_received: "active",
    under_review: "active",
    awaiting_payment: "warning",
    scheduled: "active",
    in_execution: "active",
    apostille_processing: "active",
    in_transit: "active",
    delivered: "verified",
    completed: "verified",
  };
  return map[state] ?? "idle";
}

const sizeMap: Record<string, string> = {
  sm: "orbit-sm",
  md: "orbit-md",
  lg: "orbit-lg",
  xl: "orbit-xl",
};

export function MilanoSealOrbitCore({
  mode = "dashboard",
  state = "idle",
  size = "md",
  interactive = false,
  showHalo = true,
  showRouteArcs = true,
  showNodes = true,
  showDataSegments = false,
  showLabel = false,
  segments = [],
  label = "The Milano Seal",
  className,
  crestSrc,
  onClick,
}: MilanoSealOrbitCoreProps) {
  const reducedMotion = useReducedMotion();
  const interactionState = toInteractionState(String(state));
  const nodeCount = mode === "hero" ? 6 : mode === "portal" ? 4 : 7;
  const nodes = Array.from({ length: nodeCount });
  const isNumericSize = typeof size === "number";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={!interactive && !onClick}
      style={isNumericSize ? ({ "--orbit-size": `${size}px` } as React.CSSProperties) : undefined}
      className={clsx(
        "milano-orbit-core",
        `orbit-mode-${mode}`,
        isNumericSize ? "orbit-custom-size" : sizeMap[size as string] ?? "orbit-md",
        `orbit-${interactionState}`,
        (interactive || onClick) && "orbit-interactive",
        className
      )}
    >
      {showHalo && <span className="orbit-halo" aria-hidden="true" />}

      <motion.span
        className="orbit-ring orbit-ring-primary"
        aria-hidden="true"
        animate={
          reducedMotion
            ? undefined
            : { rotate: interactionState === "loading" ? 360 : [0, 360] }
        }
        transition={
          interactionState === "loading"
            ? { duration: 8, repeat: Infinity, ease: "linear" }
            : { duration: 20, repeat: Infinity, ease: "linear" }
        }
      />

      <motion.span
        className="orbit-ring orbit-ring-secondary"
        aria-hidden="true"
        animate={reducedMotion ? undefined : { rotate: [360, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />

      {showRouteArcs && (
        <svg
          className="orbit-route-layer"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <motion.path
            d="M38 142 C80 40, 160 40, 202 142"
            className="orbit-route orbit-route-one"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: mode === "hero" ? 1.3 : 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          <motion.path
            d="M52 168 C96 92, 144 92, 188 168"
            className="orbit-route orbit-route-two"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{
              delay: 0.18,
              duration: mode === "hero" ? 1.15 : 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </svg>
      )}

      {showNodes && (
        <span className="orbit-node-layer" aria-hidden="true">
          {nodes.map((_, index) => (
            <motion.span
              key={index}
              className="orbit-node"
              style={
                {
                  "--node-index": index,
                  "--node-count": nodeCount,
                } as React.CSSProperties
              }
              initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.12 + index * 0.055,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}
        </span>
      )}

      {showDataSegments && segments.length > 0 && (
        <span className="orbit-segment-layer" aria-hidden="true">
          {segments.slice(0, 7).map((segment, index) => (
            <span
              key={segment.id}
              className={clsx(
                "orbit-segment",
                `orbit-${toInteractionState(segment.state ?? "idle")}`
              )}
              style={
                {
                  "--segment-index": index,
                  "--segment-count": Math.min(segments.length, 7),
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}

      <motion.span
        className="orbit-crest-shell"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: mode === "hero" ? 0.95 : 0.62,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Image
          src={crestSrc ?? CREST_SRC}
          alt="The Milano Seal canonical M feather crest"
          width={420}
          height={420}
          priority={mode === "hero"}
          className="orbit-crest-img"
        />
      </motion.span>

      <span className="orbit-sweep" aria-hidden="true" />

      {showLabel && (
        <span className="orbit-label" aria-hidden="true">{label}</span>
      )}
    </button>
  );
}
