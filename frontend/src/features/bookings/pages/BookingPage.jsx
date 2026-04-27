import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'

const BookingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [consultants, setConsultants] = useState([])
  const [services, setServices] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [selectedConsultant, setSelectedConsultant] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [consultantsRes, servicesRes] = await Promise.all([
          api.get('/users/?role=consultant'),
          api.get('/consultation-services/')
        ])
        setConsultants(consultantsRes.data?.results || consultantsRes.data || [])
        setServices(servicesRes.data?.results || servicesRes.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedConsultant && selectedDate) {
      const loadTimeSlots = async () => {
        setLoading(true)
        try {
          const res = await api.get(`/time-slots/?consultant=${selectedConsultant}&date=${selectedDate}&is_booked=false`)
          const data = res.data.results || res.data
          setTimeSlots(Array.isArray(data) ? data : [])
        } catch (error) {
          console.error('Error loading time slots:', error)
        } finally {
          setLoading(false)
        }
      }
      loadTimeSlots()
    } else {
      setTimeSlots([])
      setSelectedSlot(null)
    }
  }, [selectedConsultant, selectedDate])

  // Group slots by time of day
  const groupedSlots = {
    morning: timeSlots.filter(s => parseInt(s.start_time?.split(':')[0] || 0) < 12),
    afternoon: timeSlots.filter(s => {
      const h = parseInt(s.start_time?.split(':')[0] || 0)
      return h >= 12 && h < 17
    }),
    evening: timeSlots.filter(s => parseInt(s.start_time?.split(':')[0] || 0) >= 17),
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/book-appointment' } })
      return
    }
    if (!selectedSlot) {
      alert('Please select a time slot')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/bookings/', {
        slot: selectedSlot,
        service: selectedService || null,
        notes: notes
      })
      navigate('/my-bookings', { state: { message: 'Booking confirmed successfully!' } })
    } catch (error) {
      console.error('Error booking:', error)
      alert('Error booking appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-3xl">
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass mb-6"
          >
            <motion.span 
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-white/80">📅 Schedule</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            Book an <span className="gradient-text">Appointment</span>
          </h1>
          <p className="text-white/50 text-lg">
            Schedule a consultation with our experts
          </p>
        </motion.div>

        {/* ============ FORM ============ */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={handleSubmit}
          className="glass-card p-6 md:p-8 space-y-6 group hover:border-emerald-400/20 transition-all duration-300"
        >
          {/* Top accent */}
          <div className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-2">
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />
          </div>

          {/* Service Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Select Service
            </label>
            <select 
              value={selectedService} 
              onChange={(e) => setSelectedService(e.target.value)} 
              className="w-full px-4 py-3.5 glass text-white rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm cursor-pointer"
            >
              <option value="" className="bg-[#0d3320]">Select a service (optional)</option>
              {services.map(service => (
                <option key={service.id} value={service.id} className="bg-[#0d3320]">
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Consultant Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Select Consultant <span className="text-red-400">*</span>
            </label>
            <select 
              value={selectedConsultant} 
              onChange={(e) => setSelectedConsultant(e.target.value)} 
              className="w-full px-4 py-3.5 glass text-white rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm cursor-pointer"
              required
            >
              <option value="" className="bg-[#0d3320]">Choose a consultant</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0d3320]">
                  {c.full_name || c.username} - {c.role_name || c.role?.name || 'Consultant'}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Date <span className="text-red-400">*</span>
            </label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="w-full px-4 py-3.5 glass text-white rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm cursor-pointer [color-scheme:dark]"
              min={getTomorrow()} 
              required 
            />
          </div>

          {/* Time Slots */}
          <AnimatePresence>
            {selectedDate && selectedConsultant && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-3">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Available Time Slots <span className="text-red-400">*</span>
                </label>
                
                {loading ? (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <svg className="animate-spin w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-white/40">Loading available slots...</span>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="glass rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-3 opacity-50">📅</div>
                    <p className="text-white/40 font-medium">No available slots for this date</p>
                    <p className="text-sm text-white/25 mt-1">Try selecting a different date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedSlots).map(([period, slots]) => (
                      slots.length > 0 && (
                        <div key={period}>
                          <p className="text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">
                            {period} ({slots.length})
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {slots.map(slot => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedSlot(slot.id === selectedSlot ? null : slot.id)}
                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                  selectedSlot === slot.id 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]' 
                                    : 'glass text-white/60 hover:text-white hover:border-emerald-400/30'
                                }`}
                              >
                                {slot.start_time} - {slot.end_time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Additional Notes
            </label>
            <textarea 
              rows="4" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="w-full px-4 py-3.5 glass text-white placeholder:text-white/25 rounded-2xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-sm resize-none"
              placeholder="Any specific requirements or questions..."
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={submitting || !selectedSlot} 
            className="btn-primary btn-lg w-full group relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              animate={submitting ? {} : { x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {submitting ? (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Booking...
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Confirm Booking
              </span>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  )
}

export default BookingPage