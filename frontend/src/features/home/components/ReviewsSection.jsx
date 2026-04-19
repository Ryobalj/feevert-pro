import React, { useState, useEffect } from 'react'
import api from '../../../app/api'

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await api.get('/reviews/')
        const reviewData = res.data.results || res.data
        setReviews(Array.isArray(reviewData) ? reviewData : [])
      } catch (error) {
        console.error('Error loading reviews:', error)
      }
    }
    loadReviews()
  }, [])

  if (reviews.length === 0) return null

  return (
    <section className="py-20 bg-feevert-light">
      <div className="container-custom">
        <h2 className="section-title">What Our Clients Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                ))}
              </div>
              <p className="text-gray-600 mb-4">"{review.comment}"</p>
              <h4 className="font-bold">{review.client_name || review.client?.username}</h4>
              <p className="text-sm text-gray-500">{review.client_role || 'Client'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
export default ReviewsSection
