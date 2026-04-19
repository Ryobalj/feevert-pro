import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
    }
  }, [selectedConsultant, selectedDate])

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

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Book an Appointment</h1>
        <p className="text-center text-gray-600 mb-8">Schedule a consultation with our experts</p>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
          <div>
            <label className="block font-semibold mb-2">Select Service</label>
            <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none">
              <option value="">Select a service (optional)</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">Select Consultant</label>
            <select value={selectedConsultant} onChange={(e) => setSelectedConsultant(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none" required>
              <option value="">Choose a consultant</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>{c.username} - {c.role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">Select Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none" min={new Date().toISOString().split('T')[0]} required />
          </div>

          {selectedDate && selectedConsultant && (
            <div>
              <label className="block font-semibold mb-2">Available Time Slots</label>
              {loading ? (
                <div className="text-center py-4"><i className="fas fa-spinner fa-spin"></i> Loading...</div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No available slots for this date</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`px-4 py-2 rounded-xl border transition-all ${selectedSlot === slot.id ? 'bg-feevert-green text-white border-feevert-green' : 'border-gray-200 hover:border-feevert-green'}`}
                    >
                      {slot.start_time} - {slot.end_time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-2">Additional Notes</label>
            <textarea rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none" placeholder="Any specific requirements or questions..."></textarea>
          </div>

          <button type="submit" disabled={submitting || !selectedSlot} className="btn-primary w-full">
            {submitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
export default BookingPage
