"use client";

import React from "react";
import { motion } from "framer-motion";

type ModuleItem = {
  id: string;
  codename: string;
  role: string;
  integrity: number;
  throughput: number;
  custody: number;
  icon: React.ElementType;
};

export function ModuleGridMotion({ modules }: { modules: ModuleItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: i * 0.05, type: "spring", stiffness: 200 }}
          whileHover={{ y: -2 }}
          className="glass-sovereign rounded-sm p-5 metallic-edge relative group cursor-pointer overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                <m.icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[9px] text-gray-600 font-mono tracking-wider">{m.id}</div>
                <div className="font-serif text-lg font-semibold text-white tracking-tight group-hover:text-[#D4AF37] transition-colors">{m.codename}</div>
              </div>
            </div>
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full glow-emerald" />
              <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
          </div>

          <div className="text-[10px] text-[#D4AF37]/70 mb-4 tracking-wider uppercase">{m.role}</div>

          <div className="space-y-2.5">
            <MetricBar label="Integrity" value={m.integrity} color="#D4AF37" delay={i * 0.05 + 0.3} />
            <MetricBar label="Throughput" value={m.throughput} color="#10B981" delay={i * 0.05 + 0.4} />
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D4AF37]/10">
            <span className="text-[9px] text-gray-500 uppercase tracking-[0.25em]">Custody Records</span>
            <span className="text-sm font-mono font-semibold text-white">{m.custody.toLocaleString()}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      ))}
    </div>
  );
}

function MetricBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-1">
        <span className="text-gray-500 uppercase tracking-[0.25em]">{label}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-0.5 bg-black/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay, duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
    </div>
  );
}
