"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Globe, FileText, Landmark, ArrowRight } from "lucide-react";

const CREDENTIALS = [
  { icon: ShieldCheck, text: "Florida Notary Public" },
  { icon: Globe,       text: "Florida Remote Online Notary" },
  { icon: FileText,    text: "International Document Execution Liaison" },
  { icon: Landmark,    text: "Florida Notary Commission #668288" },
];

const PRIMARY_SOCIALS = [
  { label: "View LinkedIn",       url: "https://www.linkedin.com/in/mr-nickmilano/" },
  { label: "Follow on Instagram", url: "https://www.instagram.com/mr.nickmilano" },
  { label: "Read Google Reviews", url: "https://share.google/IzX9DLwBp0bZTd09I" },
];

const SECONDARY_SOCIALS = [
  { label: "Facebook", url: "https://www.facebook.com/share/1JRqXU984M/?mibextid=wwXIfr" },
];

const section = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } },
};

const slideRow = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function PaymentFounder() {
  return (
    <section className="relative py-24 md:py-32 bg-[#050507] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.04) 0%, rgba(5,5,7,0) 70%)" }}
      />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6"
        variants={section}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div variants={fadeUp} className="text-center mb-12">
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#6A5520] mb-4 block">
            Founder Trust Anchor
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white">
            Execution Led by the Founder
          </h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="relative rounded-2xl overflow-hidden border border-[#C6A55A]/25 group"
          style={{ background: "linear-gradient(145deg, #0D0D0D 0%, #080806 60%, #0A0908 100%)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/60 to-transparent" />
          <motion.div
            initial={{ x: "-100%" }}
            whileInView={{ x: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] as const, delay: 0.3 }}
            className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent pointer-events-none z-10"
          />

          <div className="flex flex-col md:flex-row">
            <motion.div
              variants={slideLeft}
              className="relative md:w-[42%] aspect-[3/4] md:aspect-auto overflow-hidden"
            >
              <Image
                src="/nicholas-milano.jpeg"
                alt="Nicholas Milano — Founder, The Milano Seal™"
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                loading="lazy"
              />
              <div className="absolute inset-0 md:bg-gradient-to-r from-transparent via-transparent to-[#0D0D0D]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent md:bg-none" />

              <motion.div variants={fadeIn} className="absolute top-5 left-5">
                <Image
                  src="/milano-seal-gold-transparent-512.png"
                  alt="Milano Seal Crest"
                  width={52}
                  height={52}
                  className="opacity-90 drop-shadow-lg"
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-col justify-center md:w-[58%] px-6 sm:px-8 md:px-12 py-10 md:py-14"
              variants={section}
            >
              <motion.p variants={fadeUp} className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#6A5520] mb-1">
                The Milano Seal™
              </motion.p>

              <motion.h3 variants={fadeUp} className="font-serif text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight">
                Nicholas Milano
              </motion.h3>

              <motion.div variants={fadeIn} className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-gradient-to-r from-[#C6A55A]/50 to-transparent" />
                <span className="text-[#C6A55A] text-[8px]">◆</span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#C6A55A]/50 to-transparent" />
              </motion.div>

              <motion.p variants={fadeUp} className="text-[#C6A55A] text-sm font-medium tracking-wide mb-1">
                Founder · Chief Trust Officer
              </motion.p>
              <motion.p variants={fadeUp} className="text-[#6A6A6A] text-xs mb-8">
                The Milano Seal™
              </motion.p>

              <ul className="space-y-3 mb-10">
                {CREDENTIALS.map(({ icon: Icon, text }) => (
                  <motion.li key={text} variants={slideRow} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1A1608] border border-[#C6A55A]/20 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-[#C6A55A]" />
                    </span>
                    <span className="text-[#D0D0D0] text-sm leading-snug">{text}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div variants={fadeUp} className="mb-5">
                <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#6A5520] block mb-2">
                  Founder-Led Execution // Personally Overseen
                </span>
                <p className="text-white/65 text-sm font-normal leading-relaxed">
                  Nicholas Milano has built his practice at the intersection of international document
                  execution, procedural compliance, and cross-border coordination — a space most
                  professionals never operate within directly. Specializing in international execution
                  workflows and destination-aware document handling, he has developed a methodology
                  that combines the rigor of Florida notarial standards with the operational precision
                  demanded by global transactions.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                <Link
                  href="/founder"
                  className="group inline-flex min-h-11 items-center justify-between gap-3 border-b border-[#C6A55A]/35 px-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#D4AF37] transition-all duration-300 hover:border-[#C6A55A] hover:pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A55A]/55 motion-reduce:transition-none motion-reduce:hover:pl-1"
                >
                  <span>View Founder Profile</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/about"
                  className="group inline-flex min-h-11 items-center justify-between gap-3 border-b border-white/12 px-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 transition-all duration-300 hover:border-[#C6A55A]/55 hover:pl-2 hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A55A]/55 motion-reduce:transition-none motion-reduce:hover:pl-1"
                >
                  <span>About The Milano Seal</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-8">
                {PRIMARY_SOCIALS.map((chip) => (
                  <motion.a
                    key={chip.url}
                    href={chip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2, x: 2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex min-h-10 items-center gap-1.5 border-b border-[#C6A55A]/15 px-1 py-2 text-[10px] font-mono tracking-wider uppercase text-[#8E8E8E] transition-colors duration-300 hover:border-[#C6A55A]/50 hover:text-[#D4AF37]"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#C6A55A]/70 flex-shrink-0" />
                    {chip.label}
                  </motion.a>
                ))}
                {SECONDARY_SOCIALS.map((chip) => (
                  <motion.a
                    key={chip.url}
                    href={chip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -1, x: 2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex min-h-10 items-center gap-1.5 border-b border-white/10 px-1 py-2 text-[10px] font-mono tracking-wider uppercase text-[#676767] transition-colors duration-300 hover:border-[#C6A55A]/35 hover:text-[#9A9A9A]"
                  >
                    {chip.label}
                  </motion.a>
                ))}
              </motion.div>

              <motion.div variants={fadeIn} className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#C6A55A]/20" />
                <span className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-[#6A5520] whitespace-nowrap">
                  Sealing Trust Across Borders
                </span>
                <div className="h-px flex-1 bg-[#C6A55A]/20" />
              </motion.div>
            </motion.div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/60 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
