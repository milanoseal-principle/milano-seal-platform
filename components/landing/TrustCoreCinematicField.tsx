"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

const TRUST_LABELS = [
  "Secure Intake",
  "Global Document Intelligence",
  "Payment-Gated Scheduling",
  "Chain-of-Custody Visibility",
  "Apostille Coordination",
  "International Release",
] as const;

type Point = { x: number; y: number };
type HoverTarget = Point & { label: string };

function shortestTarget(current: number, target: number) {
  const delta = ((((target - current) % 360) + 540) % 360) - 180;
  return current + delta;
}

function isTrustLink(link: HTMLAnchorElement) {
  const text = (link.textContent ?? "").replace(/\s+/g, " ").trim();
  return TRUST_LABELS.find((label) => text.includes(label)) ?? null;
}

export function TrustCoreCinematicField({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const beamRotation = useMotionValue(0);
  const loopRef = useRef<ReturnType<typeof animate> | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const [core, setCore] = useState<Point | null>(null);
  const [hovered, setHovered] = useState<HoverTarget | null>(null);

  const measureCore = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const rootRect = root.getBoundingClientRect();
    const candidates = Array.from(
      root.querySelectorAll<HTMLImageElement>(
        'img[alt="The Milano Seal Trust Core medallion"]',
      ),
    );
    const visible = candidates.find((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!visible) return;

    const rect = visible.getBoundingClientRect();
    setCore({
      x: rect.left - rootRect.left + rect.width / 2,
      y: rect.top - rootRect.top + rect.height / 2,
    });
  }, []);

  const startOrbit = useCallback(() => {
    if (reduceMotion) return;
    loopRef.current?.stop();
    const current = beamRotation.get();
    loopRef.current = animate(beamRotation, current + 360, {
      duration: 15,
      ease: "linear",
      repeat: Infinity,
    });
  }, [beamRotation, reduceMotion]);

  useEffect(() => {
    measureCore();
    const root = rootRef.current;
    if (!root) return;

    const observer = new ResizeObserver(measureCore);
    observer.observe(root);
    window.addEventListener("resize", measureCore);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureCore);
    };
  }, [measureCore]);

  useEffect(() => {
    if (reduceMotion) {
      loopRef.current?.stop();
      return;
    }
    startOrbit();
    return () => loopRef.current?.stop();
  }, [reduceMotion, startOrbit]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduceMotion) return;

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      if (!link || !root.contains(link)) return;
      const label = isTrustLink(link);
      if (!label) return;

      const rootRect = root.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const next = {
        x: linkRect.left - rootRect.left + linkRect.width / 2,
        y: linkRect.top - rootRect.top + linkRect.height / 2,
        label,
      };
      setHovered(next);

      const center = core;
      if (!center) return;
      const angle =
        (Math.atan2(next.y - center.y, next.x - center.x) * 180) / Math.PI +
        90;
      loopRef.current?.stop();
      loopRef.current = animate(
        beamRotation,
        shortestTarget(beamRotation.get(), angle),
        {
          type: "spring",
          stiffness: 115,
          damping: 22,
          mass: 0.9,
        },
      );
    };

    const onPointerOut = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      if (!link || !root.contains(link) || !isTrustLink(link)) return;
      const next = event.relatedTarget as Node | null;
      if (next && link.contains(next)) return;
      setHovered(null);
      startOrbit();
    };

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerout", onPointerOut);
    return () => {
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerout", onPointerOut);
    };
  }, [beamRotation, core, reduceMotion, startOrbit]);

  const beamSize = 330;

  return (
    <div ref={rootRef} className="relative isolate">
      {children}

      {!reduceMotion && core && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
          aria-hidden="true"
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: beamSize,
              height: beamSize,
              left: core.x - beamSize / 2,
              top: core.y - beamSize / 2,
              rotate: beamRotation,
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(198,165,90,0.00) 286deg, rgba(198,165,90,0.08) 318deg, rgba(238,210,132,0.34) 348deg, rgba(198,165,90,0.05) 357deg, transparent 360deg)",
              maskImage:
                "radial-gradient(circle, transparent 0 24%, rgba(0,0,0,.9) 34%, rgba(0,0,0,.98) 72%, transparent 88%)",
              WebkitMaskImage:
                "radial-gradient(circle, transparent 0 24%, rgba(0,0,0,.9) 34%, rgba(0,0,0,.98) 72%, transparent 88%)",
              filter: hovered ? "blur(0.4px)" : "blur(1px)",
              opacity: hovered ? 1 : 0.7,
              transition: "opacity 280ms ease, filter 280ms ease",
            }}
          />

          <motion.div
            className="absolute rounded-full"
            style={{
              width: 160,
              height: 160,
              left: core.x - 80,
              top: core.y - 80,
              border: "1px solid rgba(198,165,90,.16)",
              boxShadow: hovered
                ? "0 0 52px rgba(198,165,90,.22), inset 0 0 34px rgba(198,165,90,.08)"
                : "0 0 30px rgba(198,165,90,.10)",
            }}
            animate={
              hovered
                ? { scale: [1, 1.035, 1], opacity: [0.72, 1, 0.78] }
                : { scale: [1, 1.018, 1], opacity: [0.45, 0.7, 0.45] }
            }
            transition={{ duration: hovered ? 1.7 : 4.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {hovered && (
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${Math.max(rootRef.current?.clientWidth ?? 1, 1)} ${Math.max(rootRef.current?.clientHeight ?? 1, 1)}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trust-neural-signal" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(198,165,90,.12)" />
                  <stop offset="45%" stopColor="rgba(238,210,132,.82)" />
                  <stop offset="100%" stopColor="rgba(198,165,90,.20)" />
                </linearGradient>
                <filter id="trust-neural-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <motion.line
                x1={core.x}
                y1={core.y}
                x2={hovered.x}
                y2={hovered.y}
                stroke="url(#trust-neural-signal)"
                strokeWidth="1.25"
                filter="url(#trust-neural-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.72 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.line
                x1={core.x}
                y1={core.y}
                x2={hovered.x}
                y2={hovered.y}
                stroke="rgba(244,220,150,.95)"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeDasharray="5 16"
                animate={{ strokeDashoffset: [42, 0] }}
                transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                filter="url(#trust-neural-glow)"
              />
              <motion.circle
                cx={hovered.x}
                cy={hovered.y}
                r="4.5"
                fill="rgba(238,210,132,.92)"
                filter="url(#trust-neural-glow)"
                animate={{ r: [3.2, 6, 3.2], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
