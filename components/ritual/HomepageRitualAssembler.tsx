"use client";

import { motion } from "framer-motion";
import { WorldMapCanvas } from "@/components/rituals/WorldMapCanvas";

const SRC = "/ritual:milano-ritual-reference.png";

const baseImageStyle = {
  position: "absolute" as const,
  inset: 0,
  margin: "auto",
  height: "100vh",
  maxHeight: "100vh",
  width: "auto",
  maxWidth: "100vw",
  objectFit: "contain" as const,
  userSelect: "none" as const,
  WebkitUserSelect: "none" as const,
  pointerEvents: "none" as const,
  filter: "drop-shadow(0 0 32px rgba(212,175,55,0.14))",
};

const layers = [
  { key: "map", clipPath: "inset(0% 0% 43% 0%)", initial: { opacity: 0, y: -16, scale: 1.025, filter: "blur(10px)" }, delay: 0.05 },
  { key: "crest", clipPath: "inset(4% 0% 47% 0%)", initial: { opacity: 0, y: -10, scale: 0.9, filter: "blur(12px)" }, delay: 0.35 },
  { key: "wordmark", clipPath: "inset(43% 0% 31% 0%)", initial: { opacity: 0, y: 18, scale: 0.98, filter: "blur(8px)" }, delay: 0.78 },
  { key: "rail", clipPath: "inset(59% 0% 22% 0%)", initial: { opacity: 0, x: -12, filter: "blur(7px)" }, delay: 1.08 },
  { key: "checklist", clipPath: "inset(68% 0% 7% 0%)", initial: { opacity: 0, x: -18, filter: "blur(8px)" }, delay: 1.34 },
  { key: "footer", clipPath: "inset(88% 0% 0% 0%)", initial: { opacity: 0, y: 14, filter: "blur(8px)" }, delay: 1.72 },
];

export function HomepageRitualAssembler({ reduced }: { reduced: boolean }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 65% 75% at 50% 42%, rgba(212,175,55,0.08), rgba(5,5,7,0.86) 68%, #050507 100%)",
        }}
      />

      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.16, 0.32, 0.2] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-4%",
            zIndex: 1,
            pointerEvents: "none",
            mixBlendMode: "screen",
            filter: "saturate(1.2) brightness(1.05)",
          }}
        >
          <WorldMapCanvas />
        </motion.div>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {layers.map((layer) => (
          <motion.img
            key={layer.key}
            src={SRC}
            alt=""
            draggable={false}
            initial={reduced ? { opacity: 1 } : layer.initial}
            animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: reduced ? 0.1 : 0.9, delay: reduced ? 0 : layer.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...baseImageStyle, clipPath: layer.clipPath }}
          />
        ))}
      </div>

      {!reduced && (
        <motion.div
          animate={{ opacity: [0.2, 0.48, 0.22] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(58vw, 520px)",
            height: "52vh",
            zIndex: 3,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at top, rgba(255,218,130,0.34) 0%, rgba(212,175,55,0.14) 36%, transparent 76%)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {!reduced && (
        <motion.div
          initial={{ x: "-130%", opacity: 0 }}
          animate={{ x: ["-130%", "130%"], opacity: [0, 0.38, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
          style={{
            position: "absolute",
            zIndex: 4,
            top: 0,
            bottom: 0,
            width: "32vw",
            pointerEvents: "none",
            background:
              "linear-gradient(105deg, transparent 0%, rgba(255,238,180,0.08) 42%, rgba(255,238,180,0.28) 50%, rgba(212,175,55,0.08) 58%, transparent 100%)",
            mixBlendMode: "screen",
            filter: "blur(3px)",
          }}
        />
      )}
    </>
  );
}
