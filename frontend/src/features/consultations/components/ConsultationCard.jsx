import React from 'react'
import { Link } from 'react-router-dom'

const ConsultationCard = ({ consultation }) => {
  const statusConfig = {
    pending: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⏳', label: 'Pending' },
    confirmed: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '✅', label: 'Confirmed' },
    in_progress: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '🔄', label: 'In Progress' },
    completed: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '✔️', label: 'Completed' },
    cancelled: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '❌', label: 'Cancelled' },
  }

  const status = statusConfig[consultation.status] || { 
    badge: 'bg-white/10 text-white/50 border-white/10', 
    icon: '📋', 
    label: (consultation.status || 'unknown').replace('_', ' ') 
  }

  // Format date vizuri
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Kama ni leo au kesho
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 0) return 'Past due'
    if (diffDays <= 7) return `In ${diffDays} days`
    
    // Zaidi ya wiki moja
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get service icon kulingana na category
  const getServiceIcon = () => {
    if (consultation.service_category) {
      const cat = consultation.service_category.toLowerCase()
      if (cat.includes('agriculture')) return '🌾'
      if (cat.includes('environment')) return '🌍'
      if (cat.includes('business')) return '💼'
      if (cat.includes('livestock')) return '🐄'
    }
    return '💬'
  }

  // Get priority color
  const getPriorityColor = () => {
    switch (consultation.priority) {
      case 'urgent': return 'border-l-red-400'
      case 'high': return 'border-l-amber-400'
      case 'medium': return 'border-l-emerald-400/30'
      case 'low': return 'border-l-white/10'
      default: return 'border-l-transparent'
    }
  }

  return (
    <Link to={`/consultations/${consultation.id}`} className="block group">
      <div className={`glass-card p-0 overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500 border-l-2 ${getPriorityColor()}`}>
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />
        
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">{getServiceIcon()}</span>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
                {consultation.service_name || 'Consultation'}
              </h3>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.badge} flex-shrink-0`}>
              <span>{status.icon}</span>
              <span className="hidden sm:inline">{status.label}</span>
            </span>
          </div>

          {/* Service Category (kama ipo) */}
          {consultation.service_category && (
            <div className="mb-2">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/30 border border-white/5">
                {consultation.service_category}
              </span>
            </div>
          )}

          {/* Message Preview */}
          {consultation.message ? (
            <p className="text-white/40 text-sm mb-4 line-clamp-2 leading-relaxed">
              {consultation.message}
            </p>
          ) : (
            <p className="text-white/20 text-sm mb-4 italic">No message provided</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-sm">
            <div className="flex items-center gap-1.5 text-white/40">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={consultation.preferred_date && new Date(consultation.preferred_date) < new Date() ? 'text-red-400/70' : ''}>
                {formatDate(consultation.preferred_date)}
              </span>
            </div>
            
            {/* Client name + Assigned to */}
            <div className="flex items-center gap-3">
              {consultation.client_name && (
                <div className="flex items-center gap-1.5 text-white/30 text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">{consultation.client_name}</span>
                </div>
              )}

              {/* Assigned to (kama ipo) */}
              {consultation.assigned_to_name && (
                <div className="flex items-center gap-1 text-xs text-emerald-400/60">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">{consultation.assigned_to_name.split(' ')[0]}</span>
                </div>
              )}
            </div>

            {/* View Details Arrow */}
            <span className="text-emerald-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:gap-2 ml-auto">
              <span className="hidden sm:inline">View</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ConsultationCard