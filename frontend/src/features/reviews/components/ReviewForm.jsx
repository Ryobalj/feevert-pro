import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'
import RatingStars from './RatingStars'

const ReviewForm = ({ consultationId, bookingId, serviceId, onSuccess, onCancel }) => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    comment: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    if (!formData.comment.trim()) {
      setError('Please write a review')
      return
    }

    setLoading(true)
    try {
      const payload = {
        rating,
        title: formData.title || 'Review',
        comment: formData.comment,
        ...(consultationId && { consultation: consultationId }),
        ...(bookingId && { booking: bookingId }),
        ...(serviceId && { service: serviceId })
      }
      await api.post('/reviews/', payload)
      setFormData({ title: '', comment: '' })
      setRating(5)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err.response?.data?.error || 'Error submitting review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit} 
      className="space-y-5"
    >
      {/* Rating */}
      <div className="text-center">
        <label className="block text-sm font-medium text-white/60 mb-3">
          Your Rating
        </label>
        <div className="flex justify-center">
          <RatingStars rating={rating} onRatingChange={setRating} size="large" />
        </div>
        <p className="text-xs text-white/30 mt-2">
          {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Review Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Summarize your experience"
          className="w-full px-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm"
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Your Review <span className="text-red-400">*</span>
        </label>
        <textarea
          name="comment"
          rows="5"
          value={formData.comment}
          onChange={handleChange}
          placeholder="Share your experience with our service..."
          className="w-full px-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm resize-none"
          required
        />
      </div>

      {/* Error */}
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-4 rounded-xl"
        >
          {error}
        </motion.p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 group relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            animate={loading ? {} : { x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {loading ? (
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Review
            </span>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="glass px-6 py-3 rounded-full text-white font-semibold text-sm hover:border-white/30 transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  )
}

export default ReviewForm