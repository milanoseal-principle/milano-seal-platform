"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { GlobalTrustCoreHero } from "@/components/landing/global-trust-core-hero";
import { usePublicTranslations } from "@/components/i18n/PublicI18nProvider";


function HomepageMicroInit({ phrases }: { phrases: string[] }) {
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
      className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-[90vw] text-center overflow-hidden"
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
        {phrases[phraseIdx]}
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
  const { t } = usePublicTranslations();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y       = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const heroVisible = useHeroReveal([120, 280, 440, 600, 760, 920, 1100]);

  return (
    <section
      ref={ref}
      className="relative min-h-[calc(100svh-var(--header-total-height))] pt-[calc(var(--header-total-height)+clamp(12px,2vw,24px))] pb-8 lg:pb-10 flex flex-col lg:flex-row items-start justify-start overflow-x-clip"
    >
      <div className="absolute inset-0 bg-[#050507]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 65% 50%, rgba(212,175,55,0.05) 0%, rgba(16,16,20,0) 65%)" }}
      />
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--ms-gold)]/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--ms-gold)]/[0.025] rounded-full blur-3xl" />
      </motion.div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--ms-gold)]/30 to-transparent" />
      <HomepageMicroInit phrases={t.hero.init} />

      <motion.div
        style={{ opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-2 lg:py-0"
      >
        {/* ── Widescreen vault — unified single canvas, two-column on desktop ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">

          {/* LEFT: copy */}
          <div className="w-full lg:w-[52%] flex flex-col items-center lg:items-start text-center lg:text-left justify-center relative z-10 [isolation:isolate]">

            <div className={`ms-hero-line mb-4${heroVisible[0] ? " is-visible" : ""}`}>
              <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/5 max-w-fit [isolation:isolate]">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ms-gold)] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ms-gold)]" />
                </span>
                <span className="text-[var(--ms-gold)] text-xs font-semibold tracking-[0.08em] uppercase whitespace-nowrap">
                  The Milano Seal™
                </span>
              </div>
            </div>

            <h1 className="ms-hero-h1 font-serif font-medium leading-[1.08] text-white mb-2">
              <span className={`ms-hero-line block text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem]${heroVisible[1] ? " is-visible" : ""}`}>
                {t.hero.line1}
              </span>
              <span className={`ms-hero-line block text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem]${heroVisible[2] ? " is-visible" : ""}`}>
                {t.hero.line2a} <span className="ms-hero-borders-gradient italic">{t.hero.line2b}</span>
              </span>
            </h1>

            <p className={`ms-hero-line text-base md:text-lg lg:text-xl text-white/70 font-normal mb-3 max-w-xl${heroVisible[3] ? " is-visible" : ""}`}>
              {t.hero.subtitle}
            </p>

            <p className={`ms-hero-line text-sm text-white/55 mb-2 max-w-xl leading-relaxed font-normal${heroVisible[4] ? " is-visible" : ""}`}>
              {t.hero.description}
            </p>

            <p className={`ms-hero-line text-xs text-white/50 mb-4 max-w-xl font-normal${heroVisible[5] ? " is-visible" : ""}`}>
              {t.hero.compliance}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 justify-center lg:justify-start mb-3">
              <Link
                href="/intake?source=homepage"
                className="ms-cta-vault group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-[var(--ms-gold)] text-[#0A0A0A] font-semibold rounded-lg overflow-hidden"
              >
                Start Your Request
                <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }} />
              </Link>
              <Link
                href="/pricing?source=homepage#get-pricing"
                className="inline-flex items-center justify-center px-7 py-3.5 border border-[var(--ms-gold)]/40 text-white/85 font-medium rounded-lg transition-colors duration-300 hover:border-[var(--ms-gold)]/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ms-gold)]"
              >
                Get Pricing
              </Link>
              <Link
                href="/speak-with-nicholas?source=homepage&originating_page=%2F"
                className="inline-flex min-h-12 items-center justify-center px-4 text-sm font-medium text-white/65 underline decoration-[var(--ms-gold)]/35 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ms-gold)]"
              >
                Speak With Nicholas
              </Link>
            </div>

            <Link
              href="/map"
              className="mb-5 inline-flex items-center gap-2 text-xs text-white/45 transition-colors hover:text-white/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ms-gold)]"
            >
              <Globe className="h-3.5 w-3.5" />
              {t.hero.intelligence}
            </Link>

            <div className={`ms-hero-line w-full${heroVisible[6] ? " is-visible" : ""}`}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--ms-gold)]/45 mb-2 text-center lg:text-left">
                {t.hero.whatYouGet}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-3 max-w-xl lg:max-w-none">
                {["shield","monitor","check","globe","lock","eye"].map((icon, index) => {
                  const label = t.hero.benefits[index];
                  return (
                  <div key={label} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-9 h-9 rounded-lg border border-[var(--ms-gold)]/20 bg-[var(--ms-gold)]/[0.04] flex items-center justify-center group-hover:border-[var(--ms-gold)]/40 transition-colors">
                      {icon === "shield" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ms-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                      {icon === "monitor" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ms-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
                      {icon === "check" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ms-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>}
                      {icon === "globe" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ms-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                      {icon === "lock" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ms-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                      {icon === "eye" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ms-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </div>
                    <span className="font-mono text-[8px] text-[#4A4A4A] tracking-wide leading-tight text-center whitespace-pre-line group-hover:text-[#6A6A6A] transition-colors">
                      {label}
                    </span>
                  </div>
                )})}
              </div>
              <p className="mt-3 max-w-xl text-center font-mono text-[8px] uppercase tracking-[0.1em] text-white/35 lg:text-left">
                {t.hero.ronCompliance}
              </p>
            </div>

          </div>

          {/* RIGHT: Kinetic Core */}
          <div className="w-full lg:w-[48%] flex flex-col items-center justify-center relative gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center w-full"
            >
              <GlobalTrustCoreHero />
            </motion.div>

            {/* Founder strip — desktop only, 2 lines max */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block text-center"
              style={{ maxWidth: 320 }}
            >
              <p style={{ color: "var(--ms-gold)", fontSize: 10, letterSpacing: "0.14em", marginBottom: 6, textTransform: "uppercase" }}>
                {t.hero.founderLed}
              </p>
              <p style={{ color: "rgba(176,176,176,0.6)", fontSize: 12, lineHeight: 1.55, marginBottom: 10 }}>
                {t.hero.founderSummary}
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <a href="/founder" style={{ color: "var(--ms-gold)", fontSize: 11, textDecoration: "underline", textDecorationColor: "rgba(198,165,90,0.35)" }}>{t.hero.meetFounder}</a>
                <a href="/intake" style={{ color: "var(--ms-gold)", fontSize: 11, textDecoration: "underline", textDecorationColor: "rgba(198,165,90,0.35)" }}>{t.hero.beginIntake}</a>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </section>
  );
}
