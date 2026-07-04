"use client";

import { ArrowRight, ChevronRight } from "lucide-react";

export function EngagementCTAMotion() {
  return (
    <div className="glass-sovereign rounded-sm p-8 lg:p-10 relative overflow-hidden metallic-edge">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="text-[10px] text-[#D4AF37]/70 tracking-[0.4em] uppercase mb-3 font-mono">/ INTERNATIONAL DOCUMENT EXECUTION</div>
          <h3 className="font-serif text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-3">
            Begin <span className="gold-text italic">controlled cross-border execution</span> with structured procedural coordination.
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            For attorneys, family offices, founders, and international families requiring structured U.S. document execution and apostille coordination. Final acceptance remains subject to the receiving authority.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button className="px-6 lg:px-8 py-3.5 bg-gradient-to-r from-[#F4E5B8] via-[#D4AF37] to-[#B8960A] text-black font-semibold rounded-sm text-sm tracking-wider hover:from-[#D4AF37] hover:via-[#F4E5B8] hover:to-[#D4AF37] transition-all flex items-center justify-center gap-2 glow-gold">
            Begin Secure Intake
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-6 lg:px-8 py-3.5 border border-[#D4AF37]/40 text-[#D4AF37] font-medium rounded-sm text-sm tracking-wider hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/60 transition-all flex items-center justify-center gap-2">
            Request Execution Coordination
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
