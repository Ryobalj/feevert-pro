import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const ServicesSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayedServices = data.slice(0, 6)

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle top gradient blend */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
      
      <div className="container-main relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          {/* Glass Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">🛠️ What We Offer</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Our Core{' '}
            <span className="gradient-text">Services</span>
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Comprehensive solutions tailored to your needs
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <Link to={`/services/${service.id}`} className="block group h-full">
                <div className="glass-card h-full flex flex-col relative overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
                  
                  {/* Top accent line */}
                  <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/30 group-hover:via-emerald-400/50 group-hover:to-emerald-400/30 transition-all duration-500 rounded-t-3xl" />

                  <div className="p-6 flex flex-col h-full">
                    {/* Icon with glow */}
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-xl transition-all duration-500 scale-150" />
                      <div className="relative w-14 h-14 rounded-2xl glass flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                        {service.icon || '📌'}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1 line-clamp-3">
                      {service.description}
                    </p>

                    {/* Price + Arrow */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      {service.price && parseFloat(service.price) > 0 ? (
                        <span className="text-emerald-400 font-bold text-sm">
                          From TZS {parseInt(service.price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">Contact for pricing</span>
                      )}

                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all ml-auto">
                        Learn more
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        {data.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link 
              to="/services" 
              className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-base hover:border-emerald-400/50 transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-300" />
              <span className="relative z-10">View All Services</span>
              <motion.svg 
                className="w-5 h-5 relative z-10" 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default ServicesSection