"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";

const ROUTES = [
  { id: "italy",  curve: "M210,260 C285,160 360,120 440,165", destX: 440, destY: 165 },
  { id: "spain",  curve: "M210,260 C270,180 335,150 400,185", destX: 400, destY: 185 },
  { id: "uae",    curve: "M210,260 C330,125 465,155 535,245", destX: 535, destY: 245 },
  { id: "brazil", curve: "M210,260 C265,315 300,365 335,425", destX: 335, destY: 425 },
  { id: "mexico", curve: "M210,260 C185,270 165,285 155,300", destX: 155, destY: 300 },
];

const FLORIDA = { x: 210, y: 260 };

interface Props {
  activeRouteId: string | null;
  onRouteActivate?: (id: string | null) => void;
}

export function GlobalRouteAnimation({ activeRouteId: externalActiveRouteId, onRouteActivate }: Props) {
  const [hasEntered, setHasEntered] = useState(false);
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useMilanoReducedMotion();

  // Merge external + internal active id
  const activeRouteId = externalActiveRouteId ?? internalActiveId;

  // IntersectionObserver for entry animation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handleDestEnter(id: string) {
    setInternalActiveId(id);
    onRouteActivate?.(id);
  }

  function handleDestLeave() {
    // Only clear if no external route is set
    if (!externalActiveRouteId) {
      setInternalActiveId(null);
      onRouteActivate?.(null);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 500,
      }}
    >
      <svg
        viewBox="0 0 640 480"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.1}/>
            <stop offset="50%" stopColor="#D4AF37" stopOpacity={1}/>
            <stop offset="100%" stopColor="#F4E5B8" stopOpacity={0.4}/>
          </linearGradient>
        </defs>

        {/* Route paths */}
        {ROUTES.map((route, i) => {
          const isActive = activeRouteId === route.id;
          const isInactive = activeRouteId !== null && !isActive;
          return (
            <g key={route.id}>
              {/* Base path — always visible at low opacity */}
              <motion.path
                d={route.curve}
                fill="none"
                stroke={isActive ? "#D4AF37" : "rgba(212,175,55,0.25)"}
                strokeWidth={isActive ? 2 : 1}
                opacity={isInactive ? 0.08 : isActive ? 1 : 0.18}
                filter={isActive ? "url(#routeGlow)" : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: hasEntered ? 1 : 0 }}
                transition={{
                  pathLength: {
                    duration: shouldReduceMotion ? 0 : 1.2,
                    delay: shouldReduceMotion ? 0 : i * 0.15,
                    ease: "easeInOut",
                  },
                  opacity: { duration: 0.3 },
                  stroke: { duration: 0.3 },
                  strokeWidth: { duration: 0.3 },
                }}
              />

              {/* Traveling dot — only on active route */}
              {isActive && !shouldReduceMotion && (
                <circle r={3} fill="#D4AF37" opacity={0.9}>
                  <animateMotion dur="4s" repeatCount="indefinite" path={route.curve} />
                </circle>
              )}

              {/* Destination node */}
              <motion.circle
                cx={route.destX}
                cy={route.destY}
                r={4}
                fill="transparent"
                stroke={isActive ? "#D4AF37" : "rgba(212,175,55,0.3)"}
                strokeWidth={isActive ? 1.5 : 1}
                initial={{ opacity: 0 }}
                animate={{ opacity: hasEntered ? 1 : 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : i * 0.15 + 1.0, duration: 0.4 }}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                onMouseEnter={() => handleDestEnter(route.id)}
                onMouseLeave={handleDestLeave}
              />

              {/* Pulsing ring on active destination */}
              {isActive && !shouldReduceMotion && (
                <motion.circle
                  cx={route.destX}
                  cy={route.destY}
                  r={8}
                  fill="transparent"
                  stroke="#D4AF37"
                  strokeWidth={1}
                  animate={{ opacity: [0.3, 0, 0.3], scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{ originX: `${route.destX}px`, originY: `${route.destY}px` }}
                />
              )}
            </g>
          );
        })}

        {/* Florida origin node */}
        <motion.circle
          cx={FLORIDA.x}
          cy={FLORIDA.y}
          r={5}
          fill="#D4AF37"
          initial={{ opacity: 0 }}
          animate={
            shouldReduceMotion
              ? { opacity: hasEntered ? 1 : 0 }
              : { opacity: hasEntered ? 1 : 0, scale: [1, 1.08, 1] }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.4 }
              : {
                  opacity: { duration: 0.4 },
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }
          }
        />
      </svg>
    </div>
  );
}
