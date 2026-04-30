'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Globe, Shield, FileCheck } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

const TRUST_ITEMS = [
  { icon: Shield,    label: 'Florida Notary #668288' },
  { icon: Globe,     label: 'Hague Convention Compliant' },
  { icon: FileCheck, label: 'RON Certified' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background layers */}
      <div className="absolute inset-0 bg-[#0A0A0A]" />
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C6A55A]/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#C6A55A]/3 rounded-full blur-3xl" />
      </motion.div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/30 to-transparent" />

      <motion.div style={{ opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <motion.div {...fadeUp(0.05)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/5 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A55A] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6A55A]" />
              </span>
              <span className="text-[#C6A55A] text-xs font-semibold tracking-[0.2em] uppercase">The Milano Seal™</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.1)}
              className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-medium leading-[1.1] text-white mb-6 text-balance"
            >
              U.S. Document<br />
              Execution{' '}
              <span className="text-[#C6A55A] italic">&</span>
              <br />Apostille Liaison
            </motion.h1>

            <motion.p {...fadeUp(0.18)}
              className="text-lg md:text-xl text-[#B0B0B0] mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              Coordinate your international documents with precision, discretion, and procedural control.
            </motion.p>

            <motion.p {...fadeUp(0.24)}
              className="text-sm text-[#8A8A8A] mb-10 max-w-xl mx-auto lg:mx-0 font-light"
            >
              Structured for international use. Procedural control across jurisdictions.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                href="/intake"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-semibold rounded-lg transition-all duration-300 hover:bg-[#D4B76A] hover:shadow-[0_8px_32px_rgba(198,165,90,0.3)] hover:-translate-y-0.5 active:translate-y-0"
              >
                Begin Execution
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/map"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2A2A2A] text-[#B0B0B0] font-medium rounded-lg transition-all duration-300 hover:border-[#C6A55A]/30 hover:text-white hover:bg-[#111111]"
              >
                <Globe className="w-4 h-4" />
                Compliance Map
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.38)} className="flex flex-wrap gap-4 justify-center lg:justify-start">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                  <Icon className="w-3.5 h-3.5 text-[#C6A55A]" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — founder photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#2A2A2A]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
import Image from "next/image"

<Image
  src="/nicholas-milano.jpeg"
  alt="Nicholas Milano — Founder, The Milano Seal"
  fill
  className="object-cover object-top"
  priority
/>              <img
                src="/nicholas-milano.jpeg"
                alt="Nicholas Milano — Founder, The Milano Seal"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {/* Credential badge */}
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="bg-[#0A0A0A]/90 backdrop-blur-sm border border-[#2A2A2A] rounded-xl p-5">
                  <p className="text-[#C6A55A] font-medium mb-1">Nicholas Milano</p>
                  <p className="text-sm text-[#B0B0B0]">Founder · The Milano Seal™</p>
                  <p className="text-xs text-[#8A8A8A] mt-1">Florida Notary #668288 · RON Specialist</p>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-[#C6A55A]/8 rounded-full blur-3xl pointer-events-none" />
          </motion.div>

        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#111111] to-transparent" />
    </section>
  )
}
