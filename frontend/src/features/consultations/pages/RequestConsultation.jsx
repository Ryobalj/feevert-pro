import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const RequestConsultation = () => {
  const [services, setServices] = useState([])
  const [formData, setFormData] = useState({
    service: '', preferred_date: '', message: '', budget_range: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await api.get('/consultation-services/')
        setServices(res.data?.results || res.data || [])
      } catch (error) { console.error('Error loading services:', error) }
      finally { setFetching(false) }
    }
    loadServices()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.service) {
      setError('Please select a service')
      return
    }
    if (!formData.preferred_date) {
      setError('Please select a preferred date')
      return
    }
    
    setLoading(true)
    
    try {
      await api.post('/consultation-requests/', formData)
      setSubmitted(true)
      setTimeout(() => navigate('/consultations', { replace: true }), 2000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err.response?.data?.error || 'Error submitting request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============ FETCHING ============
  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-2xl">
        {/* ============ HEADER ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6">
            <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-sm font-medium text-white/80">💬 Get in Touch</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            Request <span className="gradient-text">Consultation</span>
          </h1>
          <p className="text-white/50 text-lg">
            Fill out the form and we'll get back to you shortly
          </p>
        </motion.div>

        {/* ============ SUCCESS ============ */}
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="glass-card p-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative inline-block mb-6">
              <motion.div className="absolute -inset-6 bg-emerald-400/15 rounded-full blur-xl" animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
            </motion.div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Request Submitted!</h2>
            <p className="text-white/50 text-sm mb-4">Thank you for your request. We'll contact you soon.</p>
            <div className="h-0.5 bg-emerald-400/30 rounded-full w-16 mx-auto mb-6 animate-pulse" />
            <p className="text-white/30 text-xs">Redirecting to consultations...</p>
          </motion.div>
        ) : (
          /* ============ FORM ============ */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-6 md:p-8 group hover:border-emerald-400/20 transition-all duration-300">
            
            {/* Top accent */}
            <div className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Service Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Select Service <span className="text-red-400">*</span>
                </label>
                <select value={formData.service} onChange={(e) => { setFormData({...formData, service: e.target.value}); setError('') }} required
                  className="w-full px-4 py-3.5 glass text-white rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm cursor-pointer">
                  <option value="" className="bg-[#0d3320]">Choose a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id} className="bg-[#0d3320]">
                      {service.name} {service.price ? `— TZS ${parseInt(service.price).toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Preferred Date & Time <span className="text-red-400">*</span>
                </label>
                <input type="datetime-local" value={formData.preferred_date} onChange={(e) => { setFormData({...formData, preferred_date: e.target.value}); setError('') }} required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3.5 glass text-white rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm cursor-pointer [color-scheme:dark]" />
              </div>

              {/* Budget Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Budget Range <span className="text-white/30 text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">💰</div>
                  <input type="text" value={formData.budget_range} onChange={(e) => setFormData({...formData, budget_range: e.target.value})}
                    placeholder="e.g., 500,000 - 1,000,000 TZS"
                    className="w-full pl-11 pr-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm" />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Additional Message
                </label>
                <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} rows="5"
                  placeholder="Tell us more about your needs, requirements, or any questions you have..."
                  className="w-full px-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm resize-none" />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="btn-primary btn-lg w-full group relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" animate={loading ? {} : { x: ['-200%', '200%'] }} transition={{ duration: 2, repeat: Infinity }} />
                {loading ? (
                  <span className="relative z-10 flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting...</span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Submit Request</span>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default RequestConsultation