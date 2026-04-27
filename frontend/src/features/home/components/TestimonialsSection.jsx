import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <motion.svg 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-white/10'}`}
        fill="currentColor" 
        viewBox="0 0 24 24"
        initial={i < rating ? { scale: 0 } : {}}
        whileInView={i < rating ? { scale: 1 } : {}}
        transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </motion.svg>
    ))}
  </div>
)

const TestimonialsSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayedTestimonials = data.slice(0, 3)

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
              className="w-2 h-2 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">⭐ Client Testimonials</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            What Our{' '}
            <span className="gradient-text">Clients</span> Say
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Don't just take our word for it — hear from our satisfied clients
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {displayedTestimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <div className="glass-card h-full flex flex-col relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300">
                {/* Quote Watermark */}
                <div className="absolute -top-4 -right-2 text-8xl text-white/[0.02] font-serif select-none pointer-events-none group-hover:text-emerald-400/[0.04] transition-colors duration-500">
                  ❝
                </div>

                <div className="p-6 flex flex-col h-full relative z-10">
                  {/* Stars */}
                  <div className="mb-4">
                    <StarRating rating={testimonial.rating || 5} />
                  </div>
                  
                  {/* Content */}
                  <p className="text-white/70 leading-relaxed mb-6 flex-1 text-sm italic">
                    "{testimonial.content?.substring(0, 180)}{testimonial.content?.length > 180 ? '...' : ''}"
                  </p>
                  
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-4" />
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-sm transition-all duration-300" />
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10 group-hover:ring-emerald-400/30 transition-all duration-300">
                        {testimonial.client_name?.charAt(0) || 'C'}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors duration-300">
                        {testimonial.client_name}
                      </h4>
                      <p className="text-xs text-white/40">
                        {testimonial.client_role || 'Client'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link 
            to="/reviews" 
            className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-base hover:border-emerald-400/50 transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-300" />
            <span className="relative z-10">Read All Reviews</span>
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
      </div>
    </section>
  )
}

export default TestimonialsSection