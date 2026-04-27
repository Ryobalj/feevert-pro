import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const ConsultationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadConsultation = async () => {
      try {
        const res = await api.get(`/consultation-requests/${id}/`)
        setConsultation(res.data)
      } catch (err) {
        console.error('Error loading consultation:', err)
        if (err.response?.status === 404) {
          setError('Consultation not found')
          setTimeout(() => navigate('/consultations', { replace: true }), 2000)
        } else {
          setError('Failed to load consultation details')
        }
      } finally {
        setLoading(false)
      }
    }
    loadConsultation()
  }, [id, navigate])

  const statusConfig = {
    confirmed: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '✅', label: 'Confirmed' },
    pending: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⏳', label: 'Pending' },
    in_progress: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '🔄', label: 'In Progress' },
    completed: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '✔️', label: 'Completed' },
    cancelled: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '❌', label: 'Cancelled' },
  }

  const status = statusConfig[consultation?.status] || { badge: 'bg-white/10 text-white/50 border-white/10', icon: '📋', label: 'Unknown' }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading consultation details...</p>
        </div>
      </div>
    )
  }

  // ============ ERROR ============
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <Link to="/consultations" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Consultations
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!consultation) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-2xl">
        {/* ============ BACK BUTTON ============ */}
        <motion.button
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/consultations')}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-emerald-400 transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Consultations
        </motion.button>

        {/* ============ MAIN CARD ============ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300">
          
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
                Consultation Details
              </h1>
              <p className="text-sm text-white/30 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Request #{consultation.id}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.badge}`}>
              <span>{status.icon}</span>
              {status.label}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Service & Assigned To */}
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailCard
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                label="Service"
                value={consultation.service_name || 'Consultation Service'}
              />
              <DetailCard
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                label="Assigned To"
                value={consultation.assigned_to_name || 'Pending assignment'}
              />
            </div>

            {/* Preferred Date */}
            <DetailCard
              icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Preferred Date"
              value={consultation.preferred_date 
                ? new Date(consultation.preferred_date).toLocaleString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : 'N/A'}
            />

            {/* Budget Range */}
            {consultation.budget_range && (
              <DetailCard
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Budget Range"
                value={consultation.budget_range}
              />
            )}

            {/* Message */}
            {consultation.message && (
              <DetailCard
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                label="Message"
                value={consultation.message}
                fullWidth
              />
            )}

            {/* Response / Admin Notes */}
            {consultation.admin_notes && (
              <DetailCard
                icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                label="Response"
                value={consultation.admin_notes}
                fullWidth
                highlight
              />
            )}

            {/* Requested On */}
            <DetailCard
              icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Requested On"
              value={consultation.created_at ? new Date(consultation.created_at).toLocaleString() : 'N/A'}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============ DETAIL CARD ============
const DetailCard = ({ icon, label, value, fullWidth = false, highlight = false }) => (
  <div className={`glass rounded-2xl p-4 hover:border-emerald-400/20 transition-all duration-300 group/card ${
    fullWidth ? 'col-span-full' : ''
  } ${
    highlight ? 'border-l-[3px] border-l-emerald-400 bg-emerald-400/[0.03]' : ''
  }`}>
    <div className="flex items-center gap-3 mb-2">
      <span className="flex-shrink-0">{icon}</span>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
        {label}
      </p>
    </div>
    <div className={`text-white font-medium pl-8 ${fullWidth ? 'text-sm leading-relaxed' : ''}`}>
      {value}
    </div>
  </div>
)

export default ConsultationDetail