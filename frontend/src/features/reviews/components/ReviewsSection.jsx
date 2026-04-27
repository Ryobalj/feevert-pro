import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'
import RatingStars from '../../reviews/components/RatingStars'

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await api.get('/reviews/')
        const reviewData = res.data.results || res.data
        setReviews(Array.isArray(reviewData) ? reviewData : [])
      } catch (error) { console.error('Error loading reviews:', error) }
      finally { setLoading(false) }
    }
    loadReviews()
  }, [])

  if (loading) return null

  if (reviews.length === 0) return null

  const displayedReviews = reviews.slice(0, 3)
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : 0

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a2a19]/50 to-transparent pointer-events-none" />
      
      <div className="container-main relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass mb-6"
          >
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold text-white">{averageRating}</span>
            <span className="text-xs text-white/30">•</span>
            <span className="text-xs text-white/50">{reviews.length} Reviews</span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            What Our{' '}
            <span className="gradient-text">Clients</span> Say
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Hear from our satisfied clients about their experience working with us
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {displayedReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
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
                    <RatingStars rating={review.rating || 5} readonly size="small" />
                  </div>
                  
                  {/* Content */}
                  <p className="text-white/70 leading-relaxed mb-6 flex-1 text-sm italic">
                    "{review.comment?.substring(0, 180)}{review.comment?.length > 180 ? '...' : ''}"
                  </p>
                  
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-4" />
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-sm transition-all duration-300" />
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10 group-hover:ring-emerald-400/30 transition-all duration-300">
                        {(review.client_name || review.client?.username || 'C').charAt(0)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors duration-300">
                        {review.client_name || review.client?.username || 'Client'}
                      </h4>
                      <p className="text-xs text-white/40">
                        {review.client_role || 'Client'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        {reviews.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link 
              to="/reviews" 
              className="group relative inline-flex items-center gap-3 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold hover:border-emerald-400/50 transition-all duration-300"
            >
              Read All Reviews
              <motion.svg 
                className="w-5 h-5" 
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

export default ReviewsSection