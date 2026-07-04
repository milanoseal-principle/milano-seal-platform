"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Anchor, CheckCircle2 } from "lucide-react";

type CustodyEvent = {
  id: string;
  time: string;
  type: string;
  desc: string;
  actor: string;
  verified: boolean;
};

export function CustodyTimelineMotion({ events }: { events: CustodyEvent[] }) {
  return (
    <div className="glass-sovereign rounded-sm p-5 metallic-edge relative h-[420px] flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/10">
        <div className="flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[10px] font-mono text-gray-400 tracking-[0.25em] uppercase">Verified Audit Stream</span>
        </div>
        <span className="text-[10px] font-mono text-[#D4AF37]">{events.length} events</span>
      </div>

      <div className="overflow-y-auto flex-1 pr-2">
        <div className="space-y-5 pl-7 relative">
          <AnimatePresence>
            {events.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                className="relative"
              >
                {i < events.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="absolute left-[-22px] top-4 w-px h-[calc(100%+12px)] bg-gradient-to-b from-[#D4AF37]/40 to-[#D4AF37]/5 origin-top"
                  />
                )}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 350 }}
                  className="absolute left-[-26px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#D4AF37] glow-gold"
                  style={{ border: "2px solid #08080b" }}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="text-[9px] text-gray-600 font-mono tracking-wider">{e.time}</div>
                    {e.verified && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-mono font-semibold text-white tracking-wider mb-1">{e.type}</div>
                  <div className="text-xs text-gray-400 leading-relaxed mb-1">{e.desc}</div>
                  <div className="text-[9px] text-[#D4AF37]/60 font-mono tracking-wider">→ {e.actor}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
