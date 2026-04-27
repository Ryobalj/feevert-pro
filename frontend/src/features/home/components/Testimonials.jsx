import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRating, setSelectedRating] = useState('all')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const res = await api.get('/testimonials/')
        const data = res.data?.results || res.data || []
        setTestimonials(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error loading testimonials:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTestimonials()
  }, [])

  const filteredTestimonials = selectedRating === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.rating === parseInt(selectedRating))

  const averageRating = testimonials.length > 0 
    ? (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / testimonials.length).toFixed(1)
    : 0

  const ratings = [
    { value: 'all', label: 'All Reviews', star: false },
    { value: '5', label: '5', star: true },
    { value: '4', label: '4', star: true },
    { value: '3', label: '3', star: true },
    { value: '2', label: '2', star: true },
    { value: '1', label: '1', star: true },
  ]

  const StarRating = ({ rating, size = 'default' }) => {
    const sizeClasses = size === 'small' ? 'w-4 h-4' : 'w-5 h-5'
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <motion.svg 
            key={i} 
            className={`${sizeClasses} ${i < rating ? 'text-amber-400' : 'text-white/10'}`}
            fill="currentColor" viewBox="0 0 24 24"
            initial={i < rating ? { scale: 0 } : {}}
            whileInView={i < rating ? { scale: 1 } : {}}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </motion.svg>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading testimonials...</p>
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
      <div className="container-main max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Rating Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass mb-6"
          >
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold text-white">{averageRating}</span>
            <span className="text-xs text-white/30">•</span>
            <span className="text-xs text-white/50">{testimonials.length} Reviews</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            What Our{' '}
            <span className="gradient-text">Clients</span> Say
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Read what our satisfied clients have to say about our services.
          </p>
        </motion.div>

        {/* Rating Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {ratings.map((rating) => (
            <motion.button
              key={rating.value}
              onClick={() => setSelectedRating(rating.value)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                selectedRating === rating.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                  : 'glass text-white/60 hover:text-white hover:border-white/30'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {rating.star && (
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
              {rating.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <AnimatePresence mode="wait">
          {filteredTestimonials.length > 0 ? (
            <motion.div
              key={selectedRating}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                >
                  <div className="glass-card h-full flex flex-col relative overflow-hidden group hover:border-emerald-400/30 transition-all duration-300">
                    {/* Quote watermark */}
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
                        "{testimonial.content}"
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
                          <h4 className="font-semibold text-white text-sm">
                            {testimonial.client_name}
                          </h4>
                          {(testimonial.client_role || testimonial.client_company) && (
                            <p className="text-xs text-white/40">
                              {[testimonial.client_role, testimonial.client_company].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>

                        {/* Date */}
                        {testimonial.created_at && (
                          <p className="text-xs text-white/25 ml-auto">
                            {new Date(testimonial.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="empty-state"
            >
              <div className="text-5xl mb-4 opacity-40">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                {selectedRating !== 'all' 
                  ? `No ${selectedRating}-star reviews found. Try another filter.`
                  : 'Be the first to share your experience with us!'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Experience CTA */}
        {filteredTestimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 mt-14 text-center hover:border-emerald-400/20 transition-all duration-300"
          >
            <div className="text-3xl mb-4">✍️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Share Your Experience
            </h2>
            <p className="text-white/40 mb-6 max-w-md mx-auto">
              We'd love to hear about your experience with our services.
            </p>
            <Link 
              to="/submit-review" 
              className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold text-base shadow-lg shadow-emerald-500/20 transition-all overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="relative z-10">Write a Review</span>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export { RatingStars }
export default TestimonialsPage