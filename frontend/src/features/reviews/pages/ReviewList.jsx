import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'
import RatingStars from '../../reviews/components/RatingStars'

const ReviewList = () => {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const [selectedRating, setSelectedRating] = useState('all')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await api.get('/reviews/')
        const data = res.data?.results || res.data || []
        setReviews(Array.isArray(data) ? data : [])
        
        const total = data.length
        const sum = data.reduce((acc, r) => acc + (r.rating || 5), 0)
        const avg = total > 0 ? (sum / total).toFixed(1) : 0
        
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        data.forEach(r => { if (r.rating) dist[r.rating]++ })
        
        setStats({ average: avg, total, distribution: dist })
      } catch (error) { console.error('Error loading reviews:', error) }
      finally { setLoading(false) }
    }
    loadReviews()
  }, [])

  const filteredReviews = selectedRating === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(selectedRating))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-12 md:py-20">
      <div className="container-main max-w-4xl">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass mb-6">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold text-white">{stats.average}</span>
            <span className="text-xs text-white/30">•</span>
            <span className="text-xs text-white/50">{stats.total} Reviews</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-4">
            Client <span className="gradient-text">Reviews</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            See what our clients say about working with us
          </p>
        </motion.div>

        {/* ============ RATING SUMMARY ============ */}
        {stats.total > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-6 md:p-8 mb-8 group hover:border-emerald-400/20 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Average */}
              <div className="text-center flex-shrink-0">
                <motion.div 
                  className="text-6xl font-extrabold gradient-text mb-2"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  {stats.average}
                </motion.div>
                <div className="flex justify-center mb-1">
                  <RatingStars rating={Math.round(stats.average)} readonly size="small" />
                </div>
                <p className="text-white/40 text-sm">Based on {stats.total} review{stats.total !== 1 ? 's' : ''}</p>
              </div>
              
              {/* Distribution Bars */}
              <div className="flex-1 space-y-2 w-full">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats.distribution[rating] || 0
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm text-white/50 w-8 flex items-center gap-0.5">
                        {rating} <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      </span>
                      <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-sm text-white/40 w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ FILTER BUTTONS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10">
          {['all', '5', '4', '3', '2', '1'].map(rating => (
            <motion.button key={rating} onClick={() => setSelectedRating(rating)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                selectedRating === rating ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'glass text-white/60 hover:text-white hover:border-white/30'
              }`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              {rating === 'all' ? 'All Reviews' : (
                <>{rating} <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg></>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* ============ REVIEWS GRID ============ */}
        {filteredReviews.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredReviews.map((review, index) => (
              <motion.div key={review.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.4 }}
                whileHover={{ y: -4 }}>
                <div className="glass-card p-6 h-full group hover:border-emerald-400/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {review.client_image ? (
                        <img src={review.client_image} alt={review.client_name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-emerald-400/30 transition-all"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                      ) : null}
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm ${review.client_image ? 'hidden' : 'flex'}`}>
                        {(review.client_name || 'C').charAt(0)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Name + Role */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-white text-sm">{review.client_name}</span>
                        {review.client_role && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                            {review.client_role}
                          </span>
                        )}
                      </div>
                      
                      {/* Stars */}
                      <div className="mb-2">
                        <RatingStars rating={review.rating || 5} readonly size="small" />
                      </div>
                      
                      {/* Content */}
                      <p className="text-white/60 text-sm leading-relaxed">
                        {review.content || review.comment}
                      </p>
                      
                      {/* Date */}
                      {review.created_at && (
                        <p className="text-white/25 text-xs mt-3">
                          {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center">
            <div className="text-5xl mb-4 opacity-40">⭐</div>
            <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
            <p className="text-white/40 max-w-sm mx-auto">
              {selectedRating !== 'all' ? `No ${selectedRating}-star reviews found.` : 'Be the first to share your experience!'}
            </p>
            {selectedRating !== 'all' && (
              <button onClick={() => setSelectedRating('all')}
                className="mt-6 px-6 py-3 rounded-full border-2 border-white/20 text-white font-semibold hover:border-emerald-400/50 transition-all duration-300">
                View all reviews
              </button>
            )}
          </motion.div>
        )}

        {/* ============ WRITE A REVIEW CTA ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.3 }} className="glass-card p-8 mt-12 text-center group hover:border-emerald-400/20 transition-all duration-300">
          <div className="text-4xl mb-4">✍️</div>
          <h2 className="text-xl font-bold text-white mb-2">Share Your Experience</h2>
          <p className="text-white/40 mb-6 max-w-md mx-auto">We'd love to hear about your experience with our services.</p>
          <Link to="/submit-review" className="group relative inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all overflow-hidden">
            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="relative z-10">Write a Review</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ReviewList