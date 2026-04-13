'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const trustPoints = [
  'Structured for international use',
  'Procedural control across jurisdictions',
  'Discretion and compliance at every step',
  'Executed properly the first time',
]

export function HighTrustClose() {
  return (
    <section className="relative py-24 md:py-32 bg-[#111111] overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-[#C6A55A] to-transparent" />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-8">
            <Shield className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">The Milano Seal™</span>
          </div>
          
          {/* Tagline */}
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Sealing Trust with Every Signature
          </h2>
          
          <p className="text-lg md:text-xl text-[#B0B0B0] mb-12 max-w-2xl mx-auto leading-relaxed">
            When your documents must be accepted internationally, precision is not optional. We coordinate the U.S. side of your matter with the care and discretion it deserves.
          </p>
          
          {/* Trust points */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {trustPoints.map((point, index) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-[#C6A55A]" />
                <span className="text-sm text-[#B0B0B0]">{point}</span>
              </motion.div>
            ))}
          </div>
          
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link
              href="/intake"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-[#C6A55A] text-[#0A0A0A] font-medium text-lg rounded-xl transition-all duration-300 hover:bg-[#D4B76A] gold-glow-hover"
            >
              <span>Begin Your Execution</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
          
          <p className="mt-8 text-sm text-[#B0B0B0]/60">
            Secure intake. Compliance-first processing. International acceptance.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
