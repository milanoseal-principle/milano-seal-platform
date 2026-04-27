'use client'

import { motion } from 'framer-motion'
import { Shield, Clock, Lock, Globe, Scale, Award } from 'lucide-react'

const items = [
  { icon: Shield, label: 'Florida Notary #668288',        sub: 'Licensed & Commissioned' },
  { icon: Globe,  label: 'Hague Convention',              sub: '21+ Countries' },
  { icon: Lock,   label: 'Payment-Gated Execution',       sub: 'Zero Exceptions' },
  { icon: Award,  label: 'RON Certified',                 sub: 'Remote Online Notary' },
  { icon: Scale,  label: 'Apostille Authority',           sub: 'FL Dept of State' },
  { icon: Clock,  label: '1-Business-Day Response',       sub: 'Matter Review' },
]

export function TrustStrip() {
  return (
    <section className="relative py-12 bg-[#111111] border-y border-[#2A2A2A] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-transparent to-[#111111] z-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-x-10 gap-y-5"
        >
          {items.map(({ icon: Icon, label, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3 group"
            >
              <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] transition-all duration-300 group-hover:border-[#C6A55A]/30 group-hover:bg-[#C6A55A]/5 flex-shrink-0">
                <Icon className="w-4 h-4 text-[#C6A55A]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#B0B0B0] group-hover:text-white transition-colors duration-300 leading-tight">{label}</div>
                <div className="text-[10px] text-[#8A8A8A] leading-tight mt-0.5">{sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
