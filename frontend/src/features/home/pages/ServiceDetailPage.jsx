import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

// ============ ICON CONVERTER ============
const iconMap = {
  ':bee:': '🐝', ':leaf:': '🌿', ':shield:': '🛡️',
  ':home:': '🏠', ':tools:': '🛠️', ':honey:': '🍯',
  ':books:': '📚', ':sunflower:': '🌻', ':clipboard:': '📋',
  ':search:': '🔍', ':recycle:': '♻️', ':globe:': '🌍',
  ':map:': '🗺️', ':scroll:': '📜', ':warning:': '⚠️',
  ':chart:': '📊', ':graduate:': '🎓', ':detective:': '🔎',
}

const getIcon = (icon) => {
  if (!icon) return '📌'
  return iconMap[icon] || icon
}

// ============ HELPERS ============
const getDisplayPrice = (service) => {
  if (service.display_price && service.display_price !== 'Get Quote') {
    return service.display_price
  }
  if (service.price_type === 'fixed' && service.price) {
    return `${service.currency || 'TZS'} ${parseFloat(service.price).toLocaleString()}`
  }
  if (service.price_type === 'range' && service.price_range_min && service.price_range_max) {
    return `${service.currency || 'TZS'} ${parseInt(service.price_range_min).toLocaleString()} - ${parseInt(service.price_range_max).toLocaleString()}`
  }
  if (service.price_type === 'hourly' && service.price) {
    return `${service.currency || 'TZS'} ${parseFloat(service.price).toLocaleString()}/hr`
  }
  if (service.price && parseFloat(service.price) > 0) {
    return `From ${service.currency || 'TZS'} ${parseInt(service.price).toLocaleString()}`
  }
  return 'Get Quote'
}

const getDuration = (minutes) => {
  if (!minutes || minutes === 0) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

const ServiceDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadService = async () => {
      try {
        const res = await api.get(`/consultation-services/${id}/`)
        setService(res.data)
      } catch (error) {
        console.error('Error loading service:', error)
        navigate('/services')
      } finally {
        setLoading(false)
      }
    }
    loadService()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (!service) return null

  const duration = getDuration(service.duration_minutes)
  const hasDetails = (service.benefits && service.benefits.length > 0) ||
                     (service.deliverables && service.deliverables.length > 0)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-12 md:py-20"
    >
      <div className="container-main max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Services
        </motion.button>

        {/* ============ SERVICE HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-10 mb-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />
          
          <div className="flex items-start gap-5 mb-6">
            {service.icon && (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/10 rounded-2xl blur-xl" />
                <div className="relative w-16 h-16 glass rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300">
                  {getIcon(service.icon)}
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2">
                    {service.name}
                  </h1>
                  {service.category_name && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {getIcon(service.category_icon)} {service.category_name}
                    </span>
                  )}
                </div>
                
                <Link 
                  to="/request-consultation"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 group/req"
                >
                  Request
                  <svg className="w-4 h-4 group-hover/req:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          
          <p className="text-lg leading-relaxed text-white/60 mb-6">
            {service.description}
          </p>

          {/* Price & Duration Cards */}
          <div className="flex flex-wrap gap-4">
            <div className="glass rounded-2xl px-6 py-4 group/price hover:border-emerald-400/30 transition-all duration-300">
              <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">
                {service.price_type === 'quote' ? 'Pricing' : 'Starting from'}
              </p>
              <p className="text-2xl md:text-3xl font-extrabold gradient-text">
                {getDisplayPrice(service)}
              </p>
            </div>
            {duration && (
              <div className="glass rounded-2xl px-6 py-4 hover:border-emerald-400/30 transition-all duration-300">
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">Duration</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {duration}
                </p>
              </div>
            )}
            {service.estimated_delivery_days > 0 && (
              <div className="glass rounded-2xl px-6 py-4 hover:border-emerald-400/30 transition-all duration-300">
                <p className="text-xs text-white/40 mb-1 uppercase tracking-wider font-medium">Delivery</p>
                <p className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {service.estimated_delivery_days} day{service.estimated_delivery_days > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ============ BENEFITS & DELIVERABLES ============ */}
        {hasDetails && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {service.benefits && service.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm">✨</span>
                  Benefits
                </h3>
                <ul className="space-y-3">
                  {service.benefits.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60 text-sm group/item">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-emerald-500/30 transition-colors">
                        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="group-hover/item:text-white/80 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {service.deliverables && service.deliverables.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">📦</span>
                  Deliverables
                </h3>
                <ul className="space-y-3">
                  {service.deliverables.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60 text-sm group/item">
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-amber-500/30 transition-colors">
                        <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="group-hover/item:text-white/80 transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}

        {/* ============ FAQ & PREREQUISITES ============ */}
        <div className="grid md:grid-cols-2 gap-6">
          {service.faq && Array.isArray(service.faq) && service.faq.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
            >
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">❓</span>
                Frequently Asked
              </h3>
              <div className="space-y-3">
                {service.faq.map((item, i) => (
                  <div key={i} className="glass rounded-xl p-4 hover:border-emerald-400/20 transition-all duration-300">
                    <p className="font-semibold text-white text-sm mb-1.5">{item.question}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {service.prerequisites && Array.isArray(service.prerequisites) && service.prerequisites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card p-6 group hover:border-emerald-400/20 transition-all duration-300"
            >
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📋</span>
                Prerequisites
              </h3>
              <ul className="space-y-3">
                {service.prerequisites.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/60 text-sm group/item">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:bg-emerald-500/30 transition-colors">
                      <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="group-hover/item:text-white/80 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ServiceDetailPage