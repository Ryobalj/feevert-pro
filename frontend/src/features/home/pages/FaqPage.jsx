import React, { useState, useEffect } from 'react'
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
        
        // Extract unique categories
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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Find answers to common questions about our services
          </p>
        </motion.div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Questions
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-green-600 text-white'
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* FAQ Accordion */}
        {filteredFaqs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`modern-card overflow-hidden ${
                  darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center"
                >
                  <span className={`font-medium text-base md:text-lg ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {faq.question}
                  </span>
                  <span className={`text-xl transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  } ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ▼
                  </span>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-6 pb-5 border-t mx-6 ${
                        darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
                      }`}>
                        <p className="pt-4 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              No FAQs found in this category.
            </p>
          </motion.div>
        )}

        {/* Still Have Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`modern-card p-8 mt-12 text-center ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Still have questions?
          </h2>
          <p className={`mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Can't find what you're looking for? We're here to help.
          </p>
          <a 
            href="/contact"
            className="glow-button inline-block px-6 py-2.5"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default FaqPage
