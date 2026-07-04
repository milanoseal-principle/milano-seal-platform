"use client";

import { Shield, Lock } from "lucide-react";

export function SovereignFooterMotion() {
  return (
    <footer className="border-t border-[#D4AF37]/15 mt-16 backdrop-blur-xl bg-[#08080b]/80">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F4E5B8] via-[#D4AF37] to-[#8B6914] flex items-center justify-center">
              <Shield className="w-5 h-5 text-black/85" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-white">The Milano Seal<sup>™</sup></div>
              <div className="text-[9px] text-gray-500 tracking-[0.3em] uppercase">International Document Execution &amp; Apostille Coordination</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:gap-6 text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase">
            <span>Florida Notary #668288</span>
            <span className="text-[#D4AF37]/40 hidden lg:inline">•</span>
            <span>Hague Compliant</span>
            <span className="text-[#D4AF37]/40 hidden lg:inline">•</span>
            <span>RON Certified</span>
            <span className="text-[#D4AF37]/40 hidden lg:inline">•</span>
            <span>EST. 2026</span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[#D4AF37]/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-[9px] font-mono text-gray-600 tracking-[0.25em] uppercase">
          <div className="flex items-center gap-3 flex-wrap">
            <Lock className="w-3 h-3" />
            <span>Motion Preview — Illustrative</span>
            <span className="text-[#D4AF37]/30">/</span>
            <span>Encryption: AES-256</span>
            <span className="text-[#D4AF37]/30">/</span>
            <span>Audit Chain: Continuous</span>
          </div>
          <div className="text-[#D4AF37]/60">Command-Center Infrastructure</div>
        </div>
      </div>
    </footer>
  );
}
