"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function OrbitalEngine() {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 480, height: 480, maxWidth: "100%" }}>

      {/* Ambient gold bloom — behind the PNG */}
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

      {/* Outer ring halo — very slow fade pulse */}
      <motion.div
        animate={{ opacity: [0.04, 0.12, 0.04] }}
        transition={{ duration: 16, ease: "easeInOut", repeat: Infinity, delay: 2 }}
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.18)",
          pointerEvents: "none",
        }}
      />

      {/* PNG — entry reveal + breath + ultra-slow rotation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10 }}
      >
        <motion.div
          animate={{ scale: [1, 1.018, 1] }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 220, ease: "linear", repeat: Infinity }}
          >
            <Image
              src="/milano-seal-orb-v2.png"
              alt="The Milano Seal"
              width={400}
              height={400}
              priority
              style={{ objectFit: "contain", width: 400, height: 400 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

    </div>
  );
}
