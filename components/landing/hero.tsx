"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { GlobalTrustCoreHero } from "@/components/landing/global-trust-core-hero";


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
      className="relative min-h-screen lg:h-screen pt-[136px] md:pt-[148px] flex flex-col lg:flex-row items-start lg:items-center justify-center overflow-hidden"
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
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 py-16 lg:py-8"
      >
        {/* ── Widescreen vault — unified single canvas, two-column on desktop ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">

          {/* LEFT: Data Terminal — badge, headline, CTAs, trust */}
          <div className="w-full lg:w-[52%] flex flex-col items-center lg:items-start text-center lg:text-left justify-center relative z-10 [isolation:isolate]">

            {/* Credential badge — animation wrapper is block, visual badge is inline-flex */}
            <div className={`ms-hero-line mb-8${heroVisible[0] ? " is-visible" : ""}`}>
              <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/5 max-w-fit [isolation:isolate]">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A55A] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6A55A]" />
                </span>
                <span className="text-[#C6A55A] text-xs font-semibold tracking-[0.2em] uppercase whitespace-nowrap">
                  The Milano Seal™
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="ms-hero-h1 font-serif text-3xl md:text-4xl lg:text-[3.25rem] xl:text-[3.75rem] font-medium leading-[1.1] text-white mb-6">
              <span className={`ms-hero-line${heroVisible[1] ? " is-visible" : ""}`}>
                Sealing Trust
              </span>
              <span className={`ms-hero-line${heroVisible[2] ? " is-visible" : ""}`}>
                Across <span className="ms-hero-borders-gradient italic">Borders</span>
              </span>
              <span className={`ms-hero-line text-[1.3rem] md:text-[1.6rem] lg:text-[1.85rem] xl:text-[2.1rem] text-[#B0B0B0] font-light mt-2${heroVisible[3] ? " is-visible" : ""}`}>
                U.S. Document Execution for International Use
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`ms-hero-line text-lg md:text-xl text-[#B0B0B0] mb-4 max-w-xl leading-relaxed font-light${heroVisible[4] ? " is-visible" : ""}`}>
              Remote Online Notarization, Apostille Coordination, and International Document Execution Support with structured routing review, payment-gated execution, and secure release coordination.
            </p>

            {/* Subtext */}
            <p className={`ms-hero-line text-sm text-[#8A8A8A] mb-10 max-w-xl font-light${heroVisible[5] ? " is-visible" : ""}`}>
              International use is subject to destination and receiving-authority requirements.
            </p>

            {/* CTAs */}
            <div className={`ms-hero-line flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8${heroVisible[6] ? " is-visible" : ""}`}>
              <Link
                href="/intake"
                className="ms-cta-vault group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-semibold rounded-lg overflow-hidden"
              >
                Begin Secure Intake
                <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }} />
              </Link>
              <Link
                href="/map"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2A2A2A] text-[#B0B0B0] font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A]/30 hover:text-white hover:bg-[#111111]"
              >
                <Globe className="w-4 h-4" />
                Explore Global Document Intelligence
              </Link>
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
              <GlobalTrustCoreHero />
            </motion.div>

          </div>

        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </section>
  );
}
