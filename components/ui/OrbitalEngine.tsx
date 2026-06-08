"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function OrbitalEngine() {
  return (
    <div className="relative w-[480px] h-[480px] flex items-center justify-center select-none" style={{ maxWidth: "100%" }}>

      {/* Ambient gold breath aura */}
      <motion.div
        animate={{ opacity: [0.03, 0.07, 0.03], scale: [1, 1.04, 1] }}
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
        style={{
          position: "absolute",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />

      {/* Orbital ring A — clockwise 90s */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 90, ease: "linear", repeat: Infinity }}
        style={{
          position: "absolute",
          width: 420,
          height: 180,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.18)",
          rotate: "-28deg",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        {/* Node on ring A */}
        <motion.div
          animate={{ boxShadow: ["0 0 4px rgba(212,175,55,0.3)", "0 0 16px rgba(212,175,55,0.7)", "0 0 4px rgba(212,175,55,0.3)"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FFF8C0, #D4AF37 55%, #8B6914)",
            border: "1px solid rgba(0,0,0,0.6)",
            marginLeft: -5,
            position: "relative",
            zIndex: 20,
          }}
        />
      </motion.div>

      {/* Node on ring A — offset 180° */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 90, ease: "linear", repeat: Infinity }}
        style={{
          position: "absolute",
          width: 420,
          height: 180,
          borderRadius: "50%",
          rotate: "-28deg",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <motion.div
          animate={{ boxShadow: ["0 0 3px rgba(212,175,55,0.2)", "0 0 10px rgba(212,175,55,0.5)", "0 0 3px rgba(212,175,55,0.2)"] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FFF8C0, #D4AF37 55%, #8B6914)",
            border: "1px solid rgba(0,0,0,0.6)",
            marginRight: -4,
            zIndex: 20,
          }}
        />
      </motion.div>

      {/* Orbital ring B — counter-clockwise 140s */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 140, ease: "linear", repeat: Infinity }}
        style={{
          position: "absolute",
          width: 380,
          height: 220,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.10)",
          rotate: "22deg",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ boxShadow: ["0 0 3px rgba(212,175,55,0.2)", "0 0 12px rgba(212,175,55,0.55)", "0 0 3px rgba(212,175,55,0.2)"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FFF8C0, #D4AF37 55%, #8B6914)",
            border: "1px solid rgba(0,0,0,0.6)",
            marginTop: -4.5,
            zIndex: 20,
          }}
        />
      </motion.div>

      {/* Orbital ring C — clockwise 170s */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 170, ease: "linear", repeat: Infinity }}
        style={{
          position: "absolute",
          width: 340,
          height: 260,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.08)",
          rotate: "-55deg",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
        }}
      >
        <motion.div
          animate={{ boxShadow: ["0 0 2px rgba(212,175,55,0.15)", "0 0 8px rgba(212,175,55,0.4)", "0 0 2px rgba(212,175,55,0.15)"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.4 }}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #FFF8C0, #D4AF37 55%, #8B6914)",
            border: "1px solid rgba(0,0,0,0.6)",
            marginBottom: -3.5,
            marginRight: -3.5,
            zIndex: 20,
          }}
        />
      </motion.div>

      {/* Central PNG — entry scale reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 30, width: 320, height: 320 }}
      >
        <Image
          src="/milano-seal-orb-v2.png"
          alt="The Milano Seal"
          width={320}
          height={320}
          priority
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </motion.div>

    </div>
  );
}
