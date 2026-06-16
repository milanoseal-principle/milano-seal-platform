"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function OrbitalEngine() {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: "min(420px, 88vw)", height: "min(420px, 88vw)" }}
    >
      {/* Ambient gold bloom */}
      <motion.div
        animate={{ opacity: [0.06, 0.18, 0.06], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.06) 40%, transparent 70%)",
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      {/* Outer halo ring */}
      <motion.div
        animate={{ opacity: [0.04, 0.12, 0.04] }}
        transition={{ duration: 16, ease: "easeInOut", repeat: Infinity, delay: 2 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.18)",
          pointerEvents: "none",
        }}
      />

      {/* PNG — entry + breath + ultra-slow rotation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}
      >
        <motion.div
          animate={{ scale: [1, 1.018, 1] }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
          style={{ width: "100%", height: "100%" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 220, ease: "linear", repeat: Infinity }}
            style={{ width: "100%", height: "100%" }}
          >
            <Image
              src="/brand/milano-crest-orbit.png"
              alt="The Milano Seal"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
