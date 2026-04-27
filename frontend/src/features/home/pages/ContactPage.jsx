import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState(null)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/site-settings/')
        setSettings(res.data?.results?.[0] || res.data?.[0] || null)
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/contact-messages/', formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const contactCards = [
    { 
      icon: '📧', 
      label: 'Email', 
      value: settings?.contact_email || 'info@feevert.co.tz', 
      link: `mailto:${settings?.contact_email || 'info@feevert.co.tz'}`,
      color: 'border-l-[var(--g-color-primary)]'
    },
    { 
      icon: '📞', 
      label: 'Phone', 
      value: settings?.contact_phone || '+255 123 456 789', 
      link: `tel:${settings?.contact_phone || '+255123456789'}`,
      color: 'border-l-emerald-500'
    },
    { 
      icon: '📍', 
      label: 'Address', 
      value: settings?.contact_address || 'Dar es Salaam, Tanzania', 
      link: null,
      color: 'border-l-teal-500'
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-16"
    >
      <div className="container-main max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
            <span className="text-lg">💬</span>
            <span className="text-sm text-[var(--g-text-secondary)]">Get in Touch</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--g-text-primary)] mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-lg text-[var(--g-text-tertiary)] max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-5 mb-12"
        >
          {contactCards.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className={`card-glass p-5 text-center border-l-4 ${item.color} hover:shadow-lg transition-shadow`}
            >
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-[var(--g-text-primary)] mb-2">
                {item.label}
              </h3>
              {item.link ? (
                <a 
                  href={item.link} 
                  className="text-sm text-[var(--g-color-primary)] hover:text-[var(--g-color-primary-light)] transition-colors font-medium"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm text-[var(--g-text-tertiary)]">
                  {item.value}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Success Message */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-center font-medium"
          >
            ✅ Message sent successfully! We'll get back to you soon.
          </motion.div>
        )}

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-glass p-6 md:p-8"
        >
          <h2 className="text-xl font-semibold text-[var(--g-text-primary)] mb-6 flex items-center gap-2">
            <span>📝</span>
            Send us a message
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="form-label form-label-required">Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input-liquid w-full"
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div>
                <label className="form-label form-label-required">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input-liquid w-full"
                    placeholder="Your email"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Phone (optional)</label>
                <div className="input-wrapper">
                  <span className="input-icon">📞</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input-liquid w-full"
                    placeholder="Your phone number"
                  />
                </div>
              </div>
              <div>
                <label className="form-label form-label-required">Subject</label>
                <div className="input-wrapper">
                  <span className="input-icon">📋</span>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="form-input-liquid w-full"
                    placeholder="Subject"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="form-label form-label-required">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="form-textarea liquid-input w-full resize-y"
                placeholder="Your message..."
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-lg w-full"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner spinner-sm" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Message
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ContactPage