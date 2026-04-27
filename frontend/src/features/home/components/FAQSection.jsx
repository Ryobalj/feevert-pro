import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FAQSection = ({ data }) => {
  const [openIndex, setOpenIndex] = useState(null)

  if (!data || data.length === 0) return null

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle top gradient blend */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
      
      <div className="container-main max-w-3xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Frequently Asked{' '}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-white/60 text-lg">Got questions? We've got answers</p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {data.map((faq, index) => {
            const isOpen = openIndex === index
            
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <div 
                  className={`glass-card overflow-hidden transition-all duration-300 ${
                    isOpen 
                      ? 'border-emerald-400/30 shadow-lg shadow-emerald-500/10' 
                      : 'hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center group"
                  >
                    {/* Question Number + Text */}
                    <div className="flex items-center gap-4 pr-4">
                      <span className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                        isOpen 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white/80'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`font-semibold text-left transition-colors duration-300 ${
                        isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'
                      }`}>
                        {faq.question}
                      </span>
                    </div>

                    {/* Chevron Icon */}
                    <motion.div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isOpen 
                          ? 'bg-emerald-500 text-white rotate-180' 
                          : 'bg-white/10 text-white/50 group-hover:bg-white/20'
                      }`}
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>

                  {/* Answer */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2">
                          {/* Divider */}
                          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                          <div className="flex gap-4">
                            {/* Answer line indicator */}
                            <div className="hidden sm:block w-1 bg-gradient-to-b from-emerald-400 to-transparent rounded-full flex-shrink-0" />
                            <p className="text-white/70 leading-relaxed text-sm md:text-base">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="glass-card p-8 inline-block">
            <p className="text-white/60 mb-3">Still have questions?</p>
            <a 
              href="/contact" 
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors inline-flex items-center gap-2 group"
            >
              Contact our support team
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FAQSection