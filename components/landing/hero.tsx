'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A] to-[#111111]" />
      
      {/* Subtle gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/30 to-transparent" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            {/* Brand badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/5 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#C6A55A]" />
              <span className="text-[#C6A55A] text-sm font-medium tracking-wide uppercase">
                The Milano Seal™
              </span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-white mb-6 text-balance"
            >
              U.S. Document Execution{' '}
              <span className="text-[#C6A55A]">&</span>{' '}
              Apostille Liaison
            </motion.h1>
            
            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-[#B0B0B0] mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Coordinate your international documents with precision, discretion, and procedural control.
            </motion.p>
            
            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-[#B0B0B0]/80 mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Structured for international use. Procedural control across jurisdictions.
            </motion.p>
            
            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link
                href="/intake"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A] gold-glow-hover"
              >
                <span>Begin Execution</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
            
            {/* Supporting line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-8 text-sm text-[#B0B0B0]/60 max-w-md mx-auto lg:mx-0"
            >
              We coordinate the U.S. side of your matter so it is executed properly and accepted internationally.
            </motion.p>
          </motion.div>
          
          {/* Right content - Nicholas Milano image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#2A2A2A] gold-glow" style={{minHeight:'400px'}}>

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
              <Image
  src="/nicholas-milano.jpg"
  alt="Nicholas Milano - Founder, The Milano Seal"
  fill
  className="object-cover object-top"
  priority
/>

              {/* Credential badge */}
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="bg-[#0A0A0A]/90 backdrop-blur-sm border border-[#2A2A2A] rounded-lg p-4">
                  <p className="text-[#C6A55A] font-medium mb-1">Nicholas Milano</p>
                  <p className="text-sm text-[#B0B0B0]">Certified Florida Notary Public</p>
                  <p className="text-xs text-[#B0B0B0]/60 mt-1">RON & Mobile Execution Specialist</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#111111] to-transparent" />
    </section>
  )
}
