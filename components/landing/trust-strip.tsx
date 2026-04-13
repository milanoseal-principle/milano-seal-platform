'use client'

import { motion } from 'framer-motion'
import { Shield, Clock, Lock, Globe, Scale } from 'lucide-react'

const trustItems = [
  { icon: Shield, label: 'Precision' },
  { icon: Clock, label: 'Reliability' },
  { icon: Lock, label: 'Discretion' },
  { icon: Globe, label: 'Cross-Border Coordination' },
  { icon: Scale, label: 'Procedural Control' },
]

export function TrustStrip() {
  return (
    <section className="relative py-16 bg-[#111111] border-y border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {trustItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-3 group"
            >
              <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] transition-all duration-300 group-hover:border-[#C6A55A]/30 group-hover:bg-[#C6A55A]/5">
                <item.icon className="w-5 h-5 text-[#C6A55A]" />
              </div>
              <span className="text-sm font-medium text-[#B0B0B0] group-hover:text-white transition-colors duration-300">
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
