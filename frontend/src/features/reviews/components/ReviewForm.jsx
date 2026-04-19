import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'
import RatingStars from './RatingStars'

const ReviewForm = ({ consultationId, bookingId, serviceId, onSuccess, onCancel }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    comment: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    setLoading(true)
    try {
      const payload = {
        rating,
        title: formData.title,
        comment: formData.comment,
        ...(consultationId && { consultation: consultationId }),
        ...(bookingId && { booking: bookingId }),
        ...(serviceId && { service: serviceId })
      }
      await api.post('/reviews/', payload)
      if (onSuccess) onSuccess()
      setFormData({ title: '', comment: '' })
      setRating(5)
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block font-semibold mb-2">Your Rating</label>
        <RatingStars rating={rating} onRatingChange={setRating} />
      </div>
      <div>
        <label className="block font-semibold mb-2">Review Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Summarize your experience"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block font-semibold mb-2">Your Review</label>
        <textarea
          name="comment"
          rows="5"
          value={formData.comment}
          onChange={handleChange}
          placeholder="Share your experience with our service..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none"
          required
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
export default ReviewForm
