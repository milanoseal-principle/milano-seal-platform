"use client";

import { motion } from "framer-motion";
import { Shield, Globe, Lock, FileCheck, Activity, Crosshair } from "lucide-react";

export function TrustStatusBarMotion() {
  const stats = [
    { label: "System Integrity", value: "99.8%", icon: Shield, tone: "gold" },
    { label: "Destination Network", value: "193 ROUTES", icon: Globe, tone: "gold" },
    { label: "Active Custody", value: "1,847", icon: Lock, tone: "gold" },
    { label: "Compliance Rate", value: "99.4%", icon: FileCheck, tone: "emerald" },
    { label: "Avg. Execution", value: "3.2 DAYS", icon: Activity, tone: "gold" },
    { label: "Trust Engine", value: "ARMED", icon: Crosshair, tone: "emerald" },
  ];

  return (
    <div className="glass-sovereign rounded-sm p-5 relative metallic-edge">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => {
          const color = s.tone === "emerald" ? "text-emerald-400" : "text-[#D4AF37]";
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="text-center px-2"
            >
              <s.icon className={`w-4 h-4 mx-auto mb-2 ${color}`} strokeWidth={1.8} />
              <div className="text-[8px] text-gray-500 uppercase tracking-[0.3em] mb-1">{s.label}</div>
              <div className={`text-sm font-mono font-semibold ${color}`}>{s.value}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
