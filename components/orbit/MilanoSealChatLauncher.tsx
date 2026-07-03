"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const CHIPS = [
  { label: "Start Intake",      href: "/intake" },
  { label: "Country Routes",    href: "/map" },
  { label: "Services",          href: "/#services" },
  { label: "Contact Founder",   href: "mailto:themilanoseal@gmail.com" },
];

// min 44px touch target for iOS/Android compliance
const CHIP_CLS = "border border-zinc-900 bg-zinc-950/60 rounded-sm text-left text-zinc-400 hover:border-amber-500/30 hover:text-amber-400 hover:bg-zinc-900/30 active:bg-zinc-900/50 transition-all duration-300 flex items-center justify-between group min-h-[44px] px-3 py-2 text-[8px] tracking-wider uppercase touch-manipulation";

export function MilanoSealChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // safe-area-inset keeps the orb above the home indicator on iOS
    <div
      className="fixed z-50 font-mono select-none"
      style={{
        bottom: "max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))",
        left:   "max(1.5rem, calc(1.5rem + env(safe-area-inset-left)))",
      }}
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="minimized_orb"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsOpen(true)}
            // 64px standalone orb — no dark circle, orb-v2 fills the space
            className="relative w-16 h-16 bg-transparent border-none flex items-center justify-center cursor-pointer group focus:outline-none touch-manipulation"
            aria-label="Open Milano Seal Concierge"
          >
            <div className="absolute inset-[-6px] rounded-full border border-amber-500/20 animate-ping opacity-15 pointer-events-none [animation-duration:3s]" />
            <div className="absolute inset-[-12px] rounded-full border border-amber-500/8 animate-ping opacity-10 pointer-events-none [animation-duration:4.5s]" />
            <motion.img
              src="/brand/milano-seal-orb-v2.png"
              alt="The Milano Seal Orb"
              animate={{ rotate: 360 }}
              transition={{ duration: 220, ease: "linear", repeat: Infinity }}
              className="w-24 h-24 object-contain relative z-10 transition-all duration-500"
              style={{
                filter: "drop-shadow(0 0 20px rgba(212,175,55,0.75)) drop-shadow(0 0 40px rgba(212,175,55,0.35))",
              }}
            />
          </motion.button>
        ) : (
          <motion.div
            key="expanded_panel"
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(15px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "min(340px, calc(100vw - 2rem))",
              // webkit prefix required for iOS Safari backdrop-filter support
              WebkitBackdropFilter: "blur(40px)",
            }}
            className="bg-[#050507]/80 backdrop-blur-[40px] border border-zinc-800 rounded-sm overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] relative"
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent z-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none z-0" />
            <div
              className="absolute inset-0 opacity-[0.015] pointer-events-none z-0"
              style={{ backgroundImage: "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==\")" }}
            />

            <div className="relative z-10 flex flex-col font-mono">
              {/* Header */}
              <div className="p-4 border-b border-zinc-900/80 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border border-amber-500/20 rounded-full flex items-center justify-center bg-zinc-950 shrink-0">
                    <img src="/brand/milano-seal-feather-m-orb.png" className="w-5 h-5 object-contain rounded-full" alt="" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold tracking-[0.15em] text-zinc-100 uppercase">Milano Seal™ Concierge</span>
                    <span className="text-[7px] text-zinc-500 tracking-wider uppercase">Secure Execution Desk</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[6.5px] text-emerald-400 font-bold tracking-widest uppercase">LIVE</span>
                </div>
              </div>

              {/* Chat canvas — -webkit-overflow-scrolling for iOS inertial scroll */}
              <div
                className="p-4 space-y-4 max-h-72 overflow-y-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 border border-zinc-800 rounded-full flex items-center justify-center bg-zinc-950 mt-0.5 shrink-0">
                    <img src="/brand/milano-seal-feather-m-orb.png" className="w-4 h-4 object-contain rounded-full" alt="" />
                  </div>
                  {/* text-[10px] kept — not an input field, no zoom risk */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-sm text-[10px] text-zinc-300 leading-relaxed tracking-wide max-w-[85%]">
                    Welcome to The Milano Seal™ secure execution desk. Select an intake pathway, review country routes, or contact the founder for cross-border document support.
                  </div>
                </div>

                {/* Quick action chips — min-h-[44px] for iOS/Android touch compliance */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {CHIPS.map((chip) => {
                    const isExternal = chip.href.startsWith("mailto") || chip.href.startsWith("http");
                    const inner = (
                      <>
                        <span>{chip.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 group-active:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 text-amber-500">→</span>
                      </>
                    );
                    return isExternal ? (
                      <a key={chip.label} href={chip.href} target={chip.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer" className={CHIP_CLS}>{inner}</a>
                    ) : (
                      <Link key={chip.label} href={chip.href} onClick={() => setIsOpen(false)} className={CHIP_CLS}>{inner}</Link>
                    );
                  })}
                </div>
              </div>

              {/* CTA — min-h-[44px] touch target */}
              <div className="px-4 pb-2">
                <Link
                  href="/intake"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-400 active:to-amber-300 text-zinc-950 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.15)] min-h-[44px] touch-manipulation"
                >
                  BEGIN SECURE INTAKE
                </Link>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-zinc-900/60 flex justify-between items-center text-[6.5px] text-zinc-500 tracking-[0.25em] uppercase font-mono bg-zinc-950/20">
                <span>FLORIDA LICENSED</span>
                <span>•</span>
                <span>PAYMENT-GATED</span>
                <span>•</span>
                <span>FOUNDER-LED</span>
              </div>
            </div>

            {/* Close — min 44px touch area */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-zinc-600 hover:text-zinc-400 active:text-zinc-300 transition-colors z-30 w-11 h-11 flex items-center justify-center touch-manipulation"
              aria-label="Close"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
