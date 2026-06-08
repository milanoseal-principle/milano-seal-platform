"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import OrbitalEngine from "@/components/ui/OrbitalEngine";


const INIT_PHRASES = [
  "Initializing International Execution Environment...",
  "Reviewing Cross-Border Routing Requirements...",
  "Preparing Protected Matter Coordination...",
];

function HomepageMicroInit() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhraseIdx(1), 1400));
    timers.push(setTimeout(() => setPhraseIdx(2), 2300));
    timers.push(setTimeout(() => setVisible(false), 3200));
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{ whiteSpace: "nowrap" }}
    >
      <motion.span
        key={phraseIdx}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 0.45, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="font-mono text-[9px] tracking-[0.22em] uppercase"
        style={{ color: "rgba(212,175,55,0.55)" }}
      >
        {INIT_PHRASES[phraseIdx]}
      </motion.span>
    </motion.div>
  );
}

function useHeroReveal(delays: number[]) {
  const [visible, setVisible] = useState<boolean[]>(() =>
    Array(delays.length).fill(false)
  );
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    delays.forEach((delay, i) => {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return visible;
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y       = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // badge(0) h1×2(1,2) support(3) subtitle(4) subtext(5) CTAs(6)
  const heroVisible = useHeroReveal([120, 280, 440, 600, 760, 920, 1100]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen lg:h-screen pt-[72px] md:pt-[80px] flex flex-col lg:flex-row items-start lg:items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050507]" />
      {/* Vault ambient — radiates from globe side (right) across text (left) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 65% 50%, rgba(212,175,55,0.05) 0%, rgba(16,16,20,0) 65%)" }}
      />
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C6A55A]/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#C6A55A]/[0.025] rounded-full blur-3xl" />
      </motion.div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/30 to-transparent" />
      <HomepageMicroInit />

      <motion.div
        style={{ opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 py-4 lg:py-0"
      >
        {/* ── Widescreen vault — unified single canvas, two-column on desktop ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">

          {/* LEFT: Data Terminal — badge, headline, CTAs, trust */}
          <div className="w-full lg:w-[52%] flex flex-col items-center lg:items-start text-center lg:text-left justify-center relative z-10 [isolation:isolate]">

            {/* Credential badge */}
            <div className={`ms-hero-line mb-6${heroVisible[0] ? " is-visible" : ""}`}>
              <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/5 max-w-fit [isolation:isolate]">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A55A] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6A55A]" />
                </span>
                <span className="text-[#C6A55A] text-xs font-semibold tracking-[0.08em] uppercase whitespace-nowrap">
                  The Milano Seal™
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="ms-hero-h1 font-serif font-medium leading-[1.08] text-white mb-3">
              <span className={`ms-hero-line block text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem]${heroVisible[1] ? " is-visible" : ""}`}>
                THE MILANO SEAL™
              </span>
            </h1>

            {/* Subtitle — separate line, lighter weight */}
            <p className={`ms-hero-line text-lg md:text-xl lg:text-2xl text-white/70 font-normal mb-5 max-w-xl${heroVisible[3] ? " is-visible" : ""}`}>
              International Document Execution &amp; Apostille Coordination
            </p>

            {/* Body */}
            <p className={`ms-hero-line text-sm md:text-base text-white/55 mb-3 max-w-xl leading-relaxed font-normal${heroVisible[4] ? " is-visible" : ""}`}>
              A premium U.S. execution partner for notarized documents, apostille coordination, authentication routing, consular legalization review, and cross-border release workflows. The Milano Seal supports attorneys, private clients, corporate teams, family offices, brokers, and international professionals who need U.S. documents prepared, reviewed, routed, and released for use abroad.
            </p>

            {/* Subtext */}
            <p className={`ms-hero-line text-sm text-white/50 mb-10 max-w-xl font-normal${heroVisible[5] ? " is-visible" : ""}`}>
              Structured intake. Payment-gated execution. Courier custody. Release review.
            </p>

            {/* CTAs */}
            <div className={`ms-hero-line flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center lg:justify-start mb-8${heroVisible[6] ? " is-visible" : ""}`}>
              <Link
                href="/intake"
                className="ms-cta-vault group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-[#C6A55A] text-[#0A0A0A] font-semibold rounded-lg overflow-hidden"
              >
                Begin Secure Intake
                <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }} />
              </Link>
              <Link
                href="/map"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#C6A55A]/30 text-white/75 font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A]/60 hover:text-white hover:bg-[#C6A55A]/5"
              >
                <Globe className="w-4 h-4" />
                Search the Atlas
              </Link>
            </div>

            {/* Trust credential strip */}
            <div className={`ms-hero-line w-full${heroVisible[6] ? " is-visible" : ""}`}>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-4 max-w-xl lg:max-w-none">
                {[
                  { icon: "shield", label: "Florida\nNotary Public" },
                  { icon: "monitor", label: "Remote\nOnline Notary" },
                  { icon: "check", label: "Apostille\nCoordination" },
                  { icon: "globe", label: "Global\nDocument Intelligence" },
                  { icon: "lock", label: "Payment-Gated\nExecution" },
                  { icon: "eye", label: "Chain-of-Custody\nVisibility" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-9 h-9 rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] flex items-center justify-center group-hover:border-[#C6A55A]/40 transition-colors">
                      {icon === "shield" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                      {icon === "monitor" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
                      {icon === "check" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>}
                      {icon === "globe" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                      {icon === "lock" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                      {icon === "eye" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </div>
                    <span className="font-mono text-[8px] text-[#4A4A4A] tracking-wide leading-tight text-center whitespace-pre-line group-hover:text-[#6A6A6A] transition-colors">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Kinetic Core — globe + founder card */}
          <div className="w-full lg:w-[48%] flex flex-col items-center justify-center relative gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              <OrbitalEngine />
            </motion.div>

            {/* PATCH 4 — Founder SEO Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ maxWidth: 340, width: "100%", textAlign: "center" }}
            >
              <p style={{ color: "#C6A55A", fontSize: 11, letterSpacing: "0.14em", marginBottom: 8, textTransform: "uppercase" }}>
                Founder-Led Document Execution
              </p>
              <p style={{ color: "rgba(176,176,176,0.8)", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                The Milano Seal™ is led by Nicholas Milano, a Florida Notary Public and Remote Online Notary supporting apostille coordination, international document execution, mobile notary requests, witness coordination, and secure release workflows for clients, attorneys, businesses, real estate professionals, healthcare providers, and private clients.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href="/founder"
                  style={{ color: "#C6A55A", fontSize: 12, textDecoration: "underline", textDecorationColor: "rgba(198,165,90,0.4)" }}
                >
                  Meet the Founder →
                </a>
                <a
                  href="/intake"
                  style={{ color: "#C6A55A", fontSize: 12, textDecoration: "underline", textDecorationColor: "rgba(198,165,90,0.4)" }}
                >
                  Begin Secure Intake →
                </a>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </section>
  );
}
