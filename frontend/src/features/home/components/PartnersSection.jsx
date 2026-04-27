import React from 'react'
import { motion } from 'framer-motion'

const PartnersSection = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      
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

        {/* Partners Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-14"
        >
          {data.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.06 }}
              whileHover={{ scale: 1.08 }}
              className="group"
            >
              {partner.logo ? (
                <div className="relative">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-2xl blur-xl transition-all duration-500 scale-150" />
                  
                  <img 
                    src={partner.logo} 
                    alt={partner.name} 
                    className="relative h-10 md:h-14 w-auto object-contain opacity-40 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              ) : (
                <div className="glass px-8 py-4 rounded-2xl group-hover:border-emerald-400/30 group-hover:shadow-lg group-hover:shadow-emerald-500/5 transition-all duration-300">
                  <span className="text-white/50 group-hover:text-white font-bold text-lg transition-colors duration-300">
                    {partner.name}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom subtle text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-white/20 text-xs mt-10"
        >
          And many more amazing partners
        </motion.p>
      </div>
    </section>
  )
}

export default PartnersSection