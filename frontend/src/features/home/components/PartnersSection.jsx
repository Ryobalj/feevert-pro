// src/features/home/components/PartnersSection.jsx

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const PartnersSection = ({ data }) => {
  if (!data || data.length === 0) return null

  // Duplicate data for seamless scrolling
  const duplicatedData = [...data, ...data, ...data]

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
      
      <div className="container-main relative z-10">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
            <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">
              Trusted by Industry Leaders
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </motion.div>

        {/* ============ MARQUEE / TICKER ============ */}
        <div className="relative overflow-hidden py-4">
          {/* Gradient overlays for smooth fade on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#0d3320] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#0d3320] to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling container */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex items-center gap-12 md:gap-16 flex-shrink-0"
              animate={{
                x: ['0%', '-50%']
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {duplicatedData.map((partner, index) => (
                <div
                  key={`${partner.id}-${index}`}
                  className="flex items-center gap-3 flex-shrink-0 group cursor-default"
                >
                  {/* Logo (small) */}
                  {partner.logo_url || partner.logo ? (
                    <div className="relative">
                      <img
                        src={partner.logo_url || partner.logo}
                        alt={partner.name}
                        className="h-6 md:h-8 w-auto object-contain opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      {/* Fallback if image fails */}
                      <span className="hidden text-white/60 group-hover:text-white font-semibold text-sm whitespace-nowrap">
                        {partner.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/60 group-hover:text-white font-semibold text-sm whitespace-nowrap transition-colors duration-300">
                      {partner.name}
                    </span>
                  )}
                  
                  {/* Separator dot */}
                  <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-emerald-400/50 transition-colors duration-300 flex-shrink-0" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom subtle text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/20 text-xs mt-6"
        >
          And many more amazing partners
        </motion.p>
      </div>
    </section>
  )
}

export default PartnersSection