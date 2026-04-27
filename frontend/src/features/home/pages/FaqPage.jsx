import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const FaqPage = () => {
  const [faqs, setFaqs] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openIndex, setOpenIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await api.get('/faqs/')
        const data = res.data?.results || res.data || []
        setFaqs(data)
        const cats = [...new Set(data.map(f => f.category).filter(Boolean))]
        setCategories(cats)
      } catch (error) {
        console.error('Error loading FAQs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFaqs()
  }, [])

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading FAQs...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-16 md:py-24"
    >
      <div className="container-main max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Glass Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">❓ FAQ</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Frequently Asked{' '}
            <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Find answers to common questions about our services
          </p>
        </motion.div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            <motion.button
              onClick={() => { setSelectedCategory('all'); setOpenIndex(null) }}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                  : 'glass text-white/60 hover:text-white hover:border-white/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All Questions
            </motion.button>
            {categories.map(cat => (
              <motion.button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setOpenIndex(null) }}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                    : 'glass text-white/60 hover:text-white hover:border-white/30'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Results Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/30 text-sm text-center mb-6"
        >
          {filteredFaqs.length} question{filteredFaqs.length !== 1 ? 's' : ''} found
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </motion.p>

        {/* FAQ Accordion */}
        {filteredFaqs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index
              
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
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

                      {/* Chevron */}
                      <motion.div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isOpen 
                            ? 'bg-emerald-500 text-white' 
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
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                            <div className="flex gap-4">
                              <div className="hidden sm:block w-1 bg-gradient-to-b from-emerald-400 to-transparent rounded-full flex-shrink-0" />
                              <p className="text-white/60 leading-relaxed text-sm md:text-base">
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
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className="text-5xl mb-4 opacity-40">📭</div>
            <h3 className="text-xl font-bold text-white mb-2">No FAQs found</h3>
            <p className="text-white/40">
              No questions found in this category. Try selecting another category.
            </p>
          </motion.div>
        )}

        {/* Still Have Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 mt-14 text-center hover:border-emerald-400/20 transition-all duration-300"
        >
          <div className="text-4xl mb-4">💡</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Still have questions?
          </h2>
          <p className="text-white/40 mb-6 max-w-md mx-auto">
            Can't find what you're looking for? We're here to help.
          </p>
          <Link 
            to="/contact" 
            className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold text-base shadow-lg shadow-emerald-500/20 transition-all overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="relative z-10">Contact Support</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default FaqPage