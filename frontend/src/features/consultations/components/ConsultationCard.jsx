import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next' // ✅ Ongeza hii

const ConsultationCard = ({ consultation }) => {
  const { t } = useTranslation('consultations') // ✅ Ongeza hii

  // ✅ Badilisha statusConfig kuwa na translation keys
  const getStatusConfig = () => {
    return {
      pending: { 
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', 
        icon: '⏳', 
        label: t('status.pending') 
      },
      confirmed: { 
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', 
        icon: '✅', 
        label: t('status.confirmed') 
      },
      in_progress: { 
        badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', 
        icon: '🔄', 
        label: t('status.in_progress') 
      },
      completed: { 
        badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', 
        icon: '✔️', 
        label: t('status.completed') 
      },
      cancelled: { 
        badge: 'bg-red-500/15 text-red-400 border-red-500/20', 
        icon: '❌', 
        label: t('status.cancelled') 
      },
    }
  }

  const statusConfig = getStatusConfig()
  const status = statusConfig[consultation.status] || { 
    badge: 'bg-white/10 text-white/50 border-white/10', 
    icon: '📋', 
    label: (consultation.status || t('status.unknown')).replace('_', ' ') 
  }

  // ✅ Badilisha formatDate kuwa na translation
  const formatDate = (dateString) => {
    if (!dateString) return t('date.tbd')
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Kama ni leo au kesho
    if (diffDays === 0) return t('date.today')
    if (diffDays === 1) return t('date.tomorrow')
    if (diffDays < 0) return t('date.past_due')
    if (diffDays <= 7) return t('date.in_days', { days: diffDays })
    
    // Zaidi ya wiki moja
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // ✅ Badilisha getServiceIcon kuwa na service category keys
  const getServiceIcon = () => {
    if (consultation.service_category) {
      const cat = consultation.service_category.toLowerCase()
      if (cat.includes('agriculture')) return t('icons.agriculture')
      if (cat.includes('environment')) return t('icons.environment')
      if (cat.includes('business')) return t('icons.business')
      if (cat.includes('livestock')) return t('icons.livestock')
    }
    return t('icons.default')
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

  // ✅ Badilisha priority label kuwa na translation
  const getPriorityLabel = () => {
    switch (consultation.priority) {
      case 'urgent': return t('priority.urgent')
      case 'high': return t('priority.high')
      case 'medium': return t('priority.medium')
      case 'low': return t('priority.low')
      default: return ''
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
                {consultation.service_name || t('consultation.default_title')}
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

          {/* Priority Badge (kama ipo) */}
          {consultation.priority && (
            <div className="mb-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                consultation.priority === 'urgent' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                consultation.priority === 'high' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                consultation.priority === 'medium' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                'bg-white/5 text-white/30 border border-white/5'
              }`}>
                {getPriorityLabel()}
              </span>
            </div>
          )}

          {/* Message Preview */}
          {consultation.message ? (
            <p className="text-white/40 text-sm mb-4 line-clamp-2 leading-relaxed">
              {consultation.message}
            </p>
          ) : (
            <p className="text-white/20 text-sm mb-4 italic">{t('consultation.no_message')}</p>
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
              <span className="hidden sm:inline">{t('consultation.view')}</span>
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