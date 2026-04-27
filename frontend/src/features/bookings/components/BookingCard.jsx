// src/features/bookings/components/BookingCard.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import BookingStatusBadge from './BookingStatusBadge'
import { formatBookingDate, formatBookingTime } from '../utils/bookingHelpers'

const BookingCard = ({ booking, darkMode }) => (
  <Link to={`/bookings/${booking.id}`} className="block group">
    <div className="glass-card hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500 rounded-t-3xl" />
      
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">📅</span>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
                  {booking.service_name || 'Consultation'}
                </h3>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            
            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <BookingInfo 
                icon={
                  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                } 
                label="Date" 
                value={formatBookingDate(booking.slot?.date)} 
              />
              <BookingInfo 
                icon={
                  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } 
                label="Time" 
                value={formatBookingTime(booking.slot)} 
              />
              <BookingInfo 
                icon={
                  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                } 
                label="Consultant" 
                value={booking.consultant_name || 'Assigned soon'} 
              />
            </div>
            
            {/* Notes */}
            {booking.notes && (
              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                <svg className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs text-white/40 line-clamp-1 italic">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div className="flex-shrink-0 flex items-center gap-1 text-emerald-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:gap-2">
            View
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </Link>
)

const BookingInfo = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    <span className="flex-shrink-0">{icon}</span>
    <span className="text-white/30 text-xs">{label}:</span>
    <span className="text-white/70 text-sm font-medium truncate">{value}</span>
  </div>
)

export default BookingCard