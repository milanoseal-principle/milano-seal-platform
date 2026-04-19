'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A] to-[#111111]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/30 to-transparent" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
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

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-[#B0B0B0] mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Coordinate your international documents with precision, discretion, and procedural control.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-[#B0B0B0]/80 mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Structured for international use. Procedural control across jurisdictions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link
                href="/intake"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
              >
                <span>Begin Execution</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-8 text-sm text-[#B0B0B0]/60 max-w-md mx-auto lg:mx-0"
            >
              We coordinate the U.S. side of your matter so it is executed properly and accepted internationally.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div style={{position:'relative',borderRadius:'16px',overflow:'hidden',border:'1px solid #2A2A2A',minHeight:'500px',aspectRatio:'4/5'}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, #0A0A0A, transparent)',zIndex:10}} />
              <img
                src="/nicholas-milano.jpg"
                alt="Nicholas Milano - Founder, The Milano Seal"
                style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}
              />
              <div style={{position:'absolute',bottom:'24px',left:'24px',right:'24px',zIndex:20}}>
                <div style={{background:'rgba(10,10,10,0.9)',border:'1px solid #2A2A2A',borderRadius:'8px',padding:'16px'}}>
                  <p style={{color:'#C6A55A',fontWeight:500,marginBottom:'4px'}}>Nicholas Milano</p>
                  <p style={{fontSize:'14px',color:'#B0B0B0'}}>Certified Florida Notary Public</p>
                  <p style={{fontSize:'12px',color:'rgba(176,176,176,0.6)',marginTop:'4px'}}>RON & Mobile Execution Specialist</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#111111] to-transparent" />
    </section>
  )
}
