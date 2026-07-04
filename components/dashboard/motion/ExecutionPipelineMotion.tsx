"use client";

import { motion, AnimatePresence } from "framer-motion";

type Matter = { id: string; num: string; client: string; dest: string; flag: string };

export function ExecutionPipelineMotion({
  matters,
}: {
  matters: { intake: Matter[]; execution: Matter[]; apostille: Matter[] };
}) {
  return (
    <div className="glass-sovereign rounded-sm p-5 metallic-edge relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PipelineColumn title="Intake" subtitle="Authentication" matters={matters.intake} color="#D4AF37" />
        <PipelineColumn title="Execution" subtitle="Active Sealing" matters={matters.execution} color="#10B981" />
        <PipelineColumn title="Apostille" subtitle="State Authority" matters={matters.apostille} color="#3B82F6" />
      </div>
    </div>
  );
}

function PipelineColumn({
  title,
  subtitle,
  matters,
  color,
}: {
  title: string;
  subtitle: string;
  matters: Matter[];
  color: string;
}) {
  return (
    <div className="bg-black/40 border border-[#D4AF37]/10 rounded-sm p-3">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#D4AF37]/10">
        <div>
          <div className="text-[10px] text-gray-300 uppercase tracking-[0.25em] font-semibold">{title}</div>
          <div className="text-[8px] text-gray-600 uppercase tracking-[0.3em] mt-0.5">{subtitle}</div>
        </div>
        <motion.div
          key={matters.length}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="text-2xl font-mono font-semibold"
          style={{ color }}
        >
          {String(matters.length).padStart(2, "0")}
        </motion.div>
      </div>

      <motion.div layout className="space-y-2 min-h-[140px]">
        <AnimatePresence mode="popLayout">
          {matters.map((m) => (
            <motion.div
              key={m.id}
              layoutId={`motion-matter-${m.id}`}
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -15 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 220, damping: 24 }}
              whileHover={{ scale: 1.02 }}
              className="bg-[#0a0a0d] border border-gray-800 hover:border-[#D4AF37]/50 rounded-sm p-2.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-[9px] font-mono" style={{ color }}>MTR-{m.num}</div>
                <span className="text-base">{m.flag}</span>
              </div>
              <div className="text-xs text-white font-medium">{m.client}</div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-[9px] text-gray-500">{m.dest}</div>
                <div className="w-1 h-1 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {matters.length === 0 && (
          <div className="text-center text-gray-700 text-[10px] py-8 font-mono tracking-wider">— NO ACTIVE —</div>
        )}
      </motion.div>
    </div>
  );
}
