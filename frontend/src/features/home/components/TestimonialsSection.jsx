import React from 'react'
import { Link } from 'react-router-dom'
import RatingStars from '../../reviews/components/RatingStars'

const TestimonialsSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayedTestimonials = data.slice(0, 3)

  return (
    <section className="py-20 bg-feevert-light">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-subtitle">Don't just take our word for it</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {displayedTestimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all animate-on-scroll" style={{ animationDelay: `${index * 0.1}s` }}>
              <RatingStars rating={testimonial.rating} readonly size="small" />
              <p className="text-gray-600 mt-4 mb-4 italic">"{testimonial.content?.substring(0, 150)}..."</p>
              <div>
                <h4 className="font-bold">{testimonial.client_name}</h4>
                <p className="text-sm text-gray-500">{testimonial.client_role || 'Client'}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/reviews" className="btn-outline">Read All Reviews →</Link>
        </div>
      </div>
    </section>
  )
}
export default TestimonialsSection
