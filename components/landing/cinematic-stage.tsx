"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function CinematicStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Hero-side gold atmosphere — present at top, dissolves as you descend
  const heroGlow = useTransform(scrollYProgress, [0, 0.22, 0.42], [0.10, 0.04, 0]);
  // Map-approach gold — rebuilds as the runway reaches Global Document Intelligence
  const mapGlow = useTransform(scrollYProgress, [0.48, 0.65, 1], [0, 0.06, 0.10]);
  // Gold filament — thread visible mid-runway, fades just before map
  const filamentOpacity = useTransform(scrollYProgress, [0.12, 0.28, 0.72, 0.88], [0, 0.55, 0.55, 0]);
  // Filament scaleY — grows down from hero, pulls back before map
  const filamentScale = useTransform(scrollYProgress, [0.12, 0.35], [0, 1]);

  return (
    <div ref={ref} className="ms-cinematic-runway relative w-full bg-[#050507] overflow-x-hidden">
      {/*
        Zero-height sticky atmospheric deck.
        Stays pinned at top-0 as content scrolls beneath.
        pointer-events-none — never intercepts taps or clicks.
      */}
      <div
        className="sticky top-0 h-0 w-full pointer-events-none select-none"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        {/* Hero bloom echo — scales with scroll, fades mid-runway */}
        <motion.div
          style={{ opacity: heroGlow }}
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[30%] w-[900px] h-[900px] rounded-full"
        >
          <div className="w-full h-full rounded-full bg-[#C6A55A]/[0.06] blur-[100px]" />
        </motion.div>

        {/* Map awakening pulse — emerges in lower runway */}
        <motion.div
          style={{ opacity: mapGlow }}
          className="absolute left-1/2 top-[70vh] -translate-x-1/2 w-[800px] h-[600px] rounded-full"
        >
          <div className="w-full h-full rounded-full bg-[#C6A55A]/[0.05] blur-[80px]" />
        </motion.div>

        {/* Gold axis filament — thin vertical thread connecting hero to map */}
        <motion.div
          style={{ opacity: filamentOpacity, scaleY: filamentScale, transformOrigin: "top center" }}
          className="absolute left-1/2 top-[20vh] -translate-x-1/2 w-px h-[55vh]"
        >
          <div className="w-full h-full bg-gradient-to-b from-[#C6A55A]/60 via-[#C6A55A]/25 to-transparent" />
        </motion.div>
      </div>

      {/* Content runway — sits above atmospheric layer, fully interactive */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
