import React, { useState } from 'react'
import api from '../../../app/api'

const NewsletterSection = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/newsletter-subscriptions/', { email })
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Error subscribing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 bg-feevert-green text-white">
      <div className="container-custom text-center">
        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="mb-6 opacity-90">Get the latest updates and offers directly to your inbox</p>
        {subscribed && <div className="bg-white/20 p-3 rounded-xl mb-4">✅ Subscribed successfully!</div>}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="flex-1 px-4 py-3 rounded-xl text-gray-800" required />
          <button type="submit" disabled={loading} className="bg-white text-feevert-green px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all">
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  )
}
export default NewsletterSection
