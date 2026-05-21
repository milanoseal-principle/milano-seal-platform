"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Globe, FileText, Landmark } from "lucide-react";

const CREDENTIALS = [
  { icon: ShieldCheck, text: "Florida Notary Public" },
  { icon: Globe,       text: "Remote Online Notary Specialist" },
  { icon: FileText,    text: "International Document Execution Liaison" },
  { icon: Landmark,    text: "Florida Notary Commission #668288" },
];

export function PaymentFounder() {
  return (
    <section className="relative py-24 md:py-32 bg-[#050507] overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.04) 0%, rgba(5,5,7,0) 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#6A5520] mb-4 block">
            Founder Trust Anchor
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white">
            Execution Led by the Founder
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative rounded-2xl overflow-hidden border border-[#C6A55A]/25"
          style={{ background: "linear-gradient(145deg, #0D0D0D 0%, #080806 60%, #0A0908 100%)" }}
        >
          {/* Gold border accent top */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/60 to-transparent" />

          <div className="flex flex-col md:flex-row">
            {/* Photo column */}
            <div className="relative md:w-[42%] aspect-[3/4] md:aspect-auto overflow-hidden">
              <Image
                src="/nicholas-milano.jpeg"
                alt="Nicholas Milano — Founder, The Milano Seal™"
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-top"
                priority
              />
              {/* Gradient overlay merging into right panel */}
              <div className="absolute inset-0 md:bg-gradient-to-r from-transparent via-transparent to-[#0D0D0D]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent md:bg-none" />

              {/* M crest overlay — top-left */}
              <div className="absolute top-5 left-5">
                <Image
                  src="/milano-seal-gold-transparent-512.png"
                  alt="Milano Seal Crest"
                  width={52}
                  height={52}
                  className="opacity-90 drop-shadow-lg"
                />
              </div>
            </div>

            {/* Credentials column */}
            <div className="flex flex-col justify-center md:w-[58%] px-8 md:px-12 py-10 md:py-14">
              {/* Wordmark */}
              <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#6A5520] mb-1">
                The Milano Seal™
              </p>

              {/* Name */}
              <h3 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight">
                Nicholas Milano
              </h3>

              {/* Gem divider */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-gradient-to-r from-[#C6A55A]/50 to-transparent" />
                <span className="text-[#C6A55A] text-[8px]">◆</span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#C6A55A]/50 to-transparent" />
              </div>

              {/* Title */}
              <p className="text-[#C6A55A] text-sm font-medium tracking-wide mb-1">
                Founder · Chief Trust Officer
              </p>
              <p className="text-[#6A6A6A] text-xs mb-8">The Milano Seal™</p>

              {/* Credentials */}
              <ul className="space-y-3 mb-10">
                {CREDENTIALS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1A1608] border border-[#C6A55A]/20 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-[#C6A55A]" />
                    </span>
                    <span className="text-[#D0D0D0] text-sm leading-snug">{text}</span>
                  </li>
                ))}
              </ul>

              {/* Footer tagline */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#C6A55A]/20" />
                <span className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-[#6A5520] whitespace-nowrap">
                  Sealing Trust Across Borders
                </span>
                <div className="h-px flex-1 bg-[#C6A55A]/20" />
              </div>
            </div>
          </div>

          {/* Gold border accent bottom */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/60 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
