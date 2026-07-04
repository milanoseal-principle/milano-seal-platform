"use client";

import React from "react";
import { Shield, Lock, Radio, Network } from "lucide-react";

export function SovereignHeaderMotion({
  currentTime,
  activeModules,
  totalModules,
}: {
  currentTime: Date;
  activeModules: number;
  totalModules: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#D4AF37]/15 backdrop-blur-2xl bg-[#08080b]/80">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F4E5B8] via-[#D4AF37] to-[#8B6914] flex items-center justify-center glow-gold relative overflow-hidden">
                <div className="absolute inset-1 rounded-full border border-black/10" />
                <Shield className="w-8 h-8 text-black/85 relative z-10" strokeWidth={2.2} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#08080b] glow-emerald" />
            </div>
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl font-semibold gold-text leading-none">
                The Milano Seal<sup className="text-sm ml-0.5">™</sup>
              </h1>
              <p className="text-[9px] text-[#D4AF37]/65 tracking-[0.4em] uppercase font-light mt-1.5">
                Command Center • Motion Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
            <HeaderStatusPill icon={Lock} label="Trust Engine" value="VERIFIED" tone="emerald" />
            <HeaderStatusPill icon={Radio} label="Hague Net" value="CONNECTED" tone="gold" />
            <HeaderStatusPill icon={Network} label="Modules" value={`${activeModules}/${totalModules}`} tone="gold" />
            <div className="border-l border-[#D4AF37]/20 pl-3 lg:pl-4">
              <div className="text-[8px] text-gray-500 uppercase tracking-[0.3em] mb-0.5">UTC System</div>
              <div className="text-sm font-mono text-white">
                {currentTime.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderStatusPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "gold" | "emerald";
}) {
  const tones = {
    gold: { border: "border-[#D4AF37]/30", text: "text-[#D4AF37]" },
    emerald: { border: "border-emerald-500/30", text: "text-emerald-400" },
  };
  const t = tones[tone];
  return (
    <div className={`glass-sovereign px-3 lg:px-4 py-2 rounded-sm flex items-center gap-2.5 border ${t.border}`}>
      <Icon className={`w-3.5 h-3.5 ${t.text}`} />
      <div>
        <div className="text-[8px] text-gray-500 uppercase tracking-[0.3em]">{label}</div>
        <div className={`text-[11px] font-mono font-semibold ${t.text}`}>{value}</div>
      </div>
    </div>
  );
}
