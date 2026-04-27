import React from 'react'
import { Link } from 'react-router-dom'

const ConsultationItem = ({ consultation, darkMode, showClient = false }) => {
  const statusConfig = {
    confirmed: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: '✅', label: 'Confirmed' },
    pending: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⏳', label: 'Pending' },
    in_progress: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: '🔄', label: 'In Progress' },
    completed: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: '✔️', label: 'Completed' },
    cancelled: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', icon: '❌', label: 'Cancelled' },
  }

  const status = statusConfig[consultation.status] || statusConfig.pending

  return (
    <Link 
      to={`/consultations/${consultation.id}`} 
      className="block group"
    >
      <div className="glass rounded-xl p-4 hover:border-emerald-400/30 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Service Name */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">💬</span>
              <p className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors duration-300 truncate">
                {consultation.service_name || 'Consultation'}
              </p>
            </div>

            {/* Client Name */}
            {showClient && consultation.client_name && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">👤</span>
                <p className="text-xs text-white/50">
                  {consultation.client_name}
                </p>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-white/40">
                {consultation.preferred_date 
                  ? new Date(consultation.preferred_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) 
                  : 'Date TBD'}
              </p>
            </div>

            {/* Time if available */}
            {consultation.preferred_time && (
              <div className="flex items-center gap-2 mt-1">
                <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-white/40">
                  {consultation.preferred_time}
                </p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.badge} flex-shrink-0`}>
            <span>{status.icon}</span>
            {status.label}
          </span>
        </div>

        {/* Hover arrow */}
        <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default ConsultationItem