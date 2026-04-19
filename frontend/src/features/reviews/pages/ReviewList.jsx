import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ReviewList = () => {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await api.get('/reviews/')
        const data = res.data?.results || res.data || []
        setReviews(data)
        
        // Calculate stats
        const total = data.length
        const sum = data.reduce((acc, r) => acc + (r.rating || 5), 0)
        const avg = total > 0 ? (sum / total).toFixed(1) : 0
        
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        data.forEach(r => { if (r.rating) dist[r.rating]++ })
        
        setStats({ average: avg, total, distribution: dist })
      } catch (error) {
        console.error('Error loading reviews:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReviews()
  }, [])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Client <span className="gradient-text">Reviews</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            See what our clients say about working with us
          </p>
        </motion.div>

        {/* Rating Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`modern-card p-8 mb-8 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <div className={`text-5xl font-bold gradient-text mb-2`}>
                {stats.average}
              </div>
              <div className="flex justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className={`text-xl ${i <= Math.round(stats.average) ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Based on {stats.total} reviews
              </p>
            </div>
            
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.distribution[rating] || 0
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className={`text-sm w-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {rating} ★
                    </span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-yellow-400 rounded-full"
                      />
                    </div>
                    <span className={`text-sm w-10 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-5"
        >
          {reviews.map((review) => (
            <motion.div key={review.id} variants={cardVariants}>
              <div className={`modern-card p-6 h-full ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {review.client_image ? (
                      <img 
                        src={review.client_image} 
                        alt={review.client_name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ${
                        review.client_image ? 'hidden' : 'flex'
                      }`}
                    >
                      <span className="text-white font-bold">
                        {review.client_name?.charAt(0) || 'C'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {review.client_name}
                      </span>
                      {review.client_role && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {review.client_role}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={`text-sm ${i <= (review.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {review.content}
                    </p>
                    
                    {review.created_at && (
                      <p className={`text-xs mt-3 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {reviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              No reviews yet. Be the first to share your experience!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ReviewList
