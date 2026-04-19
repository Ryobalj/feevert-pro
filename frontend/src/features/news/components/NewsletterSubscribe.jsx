import React, { useState } from 'react'
import api from '../../../app/api'

const NewsletterSubscribe = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    setError('')
    try {
      await api.post('/newsletter-subscriptions/', { email })
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    } catch (err) {
      setError('Failed to subscribe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-feevert-green text-white py-16">
      <div className="container-custom text-center">
        <h2 className="text-3xl font-bold mb-3">Subscribe to Our Newsletter</h2>
        <p className="mb-6 opacity-90 max-w-md mx-auto">
          Get the latest updates, news, and offers directly to your inbox.
        </p>
        
        {subscribed ? (
          <div className="bg-white/20 rounded-xl p-4 max-w-md mx-auto">
            <i className="fas fa-check-circle mr-2"></i> Thanks for subscribing!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-5 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-feevert-green px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Subscribe
            </button>
          </form>
        )}
        
        {error && <p className="text-red-200 text-sm mt-3">{error}</p>}
        <p className="text-white/70 text-xs mt-4">We respect your privacy. Unsubscribe anytime.</p>
      </div>
    </div>
  )
}
export default NewsletterSubscribe
