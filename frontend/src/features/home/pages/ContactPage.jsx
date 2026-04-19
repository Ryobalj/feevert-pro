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

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
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
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-5 mb-10"
        >
          {[
            { icon: '📧', label: 'Email', value: settings?.contact_email || 'info@feevert.co.tz', link: `mailto:${settings?.contact_email || 'info@feevert.co.tz'}` },
            { icon: '📞', label: 'Phone', value: settings?.contact_phone || '+255 123 456 789', link: `tel:${settings?.contact_phone || '+255123456789'}` },
            { icon: '📍', label: 'Address', value: settings?.contact_address || 'Dar es Salaam, Tanzania', link: null }
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -3 }}
              className={`modern-card p-5 text-center ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}
            >
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.label}
              </h3>
              {item.link ? (
                <a href={item.link} className={`text-sm hover:text-green-600 dark:hover:text-green-400 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.value}
                </a>
              ) : (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
            className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-green-700 dark:text-green-300 text-center"
          >
            ✅ Message sent successfully! We'll get back to you soon.
          </motion.div>
        )}

        {/* Contact Form */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className={`modern-card p-6 md:p-8 ${
            darkMode ? 'bg-gray-800/80' : 'bg-white/80'
          }`}
        >
          <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Send us a message
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Your email"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                  } focus:outline-none focus:ring-1 focus:ring-green-500`}
                  placeholder="Subject"
                />
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors resize-y ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-600'
                } focus:outline-none focus:ring-1 focus:ring-green-500`}
                placeholder="Your message..."
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={submitting}
                className={`glow-button w-full py-3 text-base ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ContactPage
