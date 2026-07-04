"use client";

import { motion } from "framer-motion";
import { Scale, CheckCircle2 } from "lucide-react";

export function CompliancePanelMotion() {
  const protocols = [
    { name: "Hague Convention 1961", status: "ACTIVE" },
    { name: "Receiving-Authority Review", status: "VERIFIED" },
    { name: "AES-256 Custody Encryption", status: "ARMED" },
    { name: "Audit Chain Continuity", status: "INTACT" },
    { name: "Identity Verification (KYC)", status: "CERTIFIED" },
    { name: "Consular Liaison Coordination", status: "OPERATIONAL" },
  ];

  return (
    <div className="glass-sovereign rounded-sm p-5 metallic-edge relative h-[420px] flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4AF37]/10">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[10px] font-mono text-gray-400 tracking-[0.25em] uppercase">Active Routing Protocols</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400">ALL VERIFIED</span>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {protocols.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between bg-black/30 border border-[#D4AF37]/10 rounded-sm p-3 hover:border-[#D4AF37]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-xs text-white font-medium">{p.name}</span>
            </div>
            <span className="text-[9px] font-mono font-semibold text-emerald-400 tracking-wider ml-2">{p.status}</span>
          </motion.div>
        ))}
      </div>

      <p className="mt-3 pt-3 border-t border-[#D4AF37]/10 text-[9px] text-gray-500 leading-relaxed">
        Operational routing snapshot only. Final acceptance remains subject to the receiving authority.
      </p>
    </div>
  );
}
