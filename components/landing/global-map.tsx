'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

const destinationCountries = [
  'Italy', 'Spain', 'Greece', 'Portugal', 'France', 
  'Germany', 'Brazil', 'Mexico', 'United Kingdom', 'Canada',
  'Australia', 'Netherlands', 'Switzerland', 'Austria', 'Belgium'
]

export function GlobalMap() {
  return (
    <section className="relative py-24 md:py-32 bg-[#0A0A0A] overflow-hidden">
      {/* Background map visualization */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C6A55A" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Connection lines from Florida */}
          <g stroke="#C6A55A" strokeWidth="1" opacity="0.3">
            <line x1="300" y1="250" x2="550" y2="180" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="250" x2="580" y2="200" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="2.5s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="250" x2="520" y2="220" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="250" x2="250" y2="350" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="2.2s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="250" x2="200" y2="280" strokeDasharray="5,5">
              <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="2.8s" repeatCount="indefinite" />
            </line>
          </g>
          {/* Florida marker */}
          <circle cx="300" cy="250" r="8" fill="#C6A55A" opacity="0.8">
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="300" cy="250" r="4" fill="#C6A55A" />
        </svg>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#C6A55A] text-sm font-medium tracking-wider uppercase mb-4 block">
            Global Reach
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Cross-Border Execution Authority
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            From Florida to the world. We coordinate U.S. document execution for acceptance in jurisdictions worldwide.
          </p>
        </motion.div>
        
        {/* Florida origin badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#111111] border border-[#C6A55A]/30 rounded-full gold-glow">
            <MapPin className="w-5 h-5 text-[#C6A55A]" />
            <span className="text-white font-medium">Florida, United States</span>
            <span className="text-[#B0B0B0]">|</span>
            <span className="text-[#C6A55A]">Execution Origin</span>
          </div>
        </motion.div>
        
        {/* Destination countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm text-[#B0B0B0] mb-6">Documents accepted in</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {destinationCountries.map((country, index) => (
              <motion.span
                key={country}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                className="px-4 py-2 text-sm text-[#B0B0B0] bg-[#111111] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 hover:text-white transition-all duration-300 cursor-default"
              >
                {country}
              </motion.span>
            ))}
            <span className="px-4 py-2 text-sm text-[#C6A55A] bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-lg">
              + Many More
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
