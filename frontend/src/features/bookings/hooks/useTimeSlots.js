// src/features/bookings/hooks/useTimeSlots.js

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../../app/api'

export const useTimeSlots = (consultantId, date) => {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // ============ FETCH TIME SLOTS ============
  const fetchTimeSlots = useCallback(async () => {
    if (!consultantId || !date) {
      setTimeSlots([])
      setSelectedSlot(null)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await api.get(`/time-slots/?consultant=${consultantId}&date=${date}&is_booked=false`)
      const data = res.data?.results || res.data
      const slots = Array.isArray(data) ? data : []
      setTimeSlots(slots)
      
      // Clear selected if no longer available
      if (selectedSlot && !slots.find(s => s.id === selectedSlot)) {
        setSelectedSlot(null)
      }
      
      return slots
    } catch (err) {
      console.error('Error loading time slots:', err)
      
      if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.')
      } else if (err.response?.status === 404) {
        setError('No time slots available for this date.')
      } else {
        setError('Failed to load time slots. Please try again.')
      }
      return []
    } finally {
      setLoading(false)
    }
  }, [consultantId, date, selectedSlot])

  // ============ INITIAL FETCH ============
  useEffect(() => {
    fetchTimeSlots()
  }, [fetchTimeSlots, retryCount])

  // ============ GROUPED SLOTS ============
  const groupedSlots = useMemo(() => {
    const groups = {
      morning: [],   // 06:00 - 11:59
      afternoon: [], // 12:00 - 16:59
      evening: [],   // 17:00 - 23:59
    }

    timeSlots.forEach(slot => {
      const hour = parseInt(slot.start_time?.split(':')[0] || 0)
      if (hour < 12) groups.morning.push(slot)
      else if (hour < 17) groups.afternoon.push(slot)
      else groups.evening.push(slot)
    })

    return groups
  }, [timeSlots])

  // ============ STATS ============
  const stats = useMemo(() => ({
    total: timeSlots.length,
    morningCount: groupedSlots.morning.length,
    afternoonCount: groupedSlots.afternoon.length,
    eveningCount: groupedSlots.evening.length,
  }), [timeSlots, groupedSlots])

  // ============ ACTIONS ============
  const selectSlot = useCallback((slotId) => {
    setSelectedSlot(prev => prev === slotId ? null : slotId)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedSlot(null)
  }, [])

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ============ HELPERS ============
  const getSlotById = useCallback((slotId) => {
    return timeSlots.find(s => s.id === slotId) || null
  }, [timeSlots])

  const formatSlotTime = useCallback((slot) => {
    if (!slot?.start_time) return ''
    return slot.end_time 
      ? `${slot.start_time} - ${slot.end_time}`
      : slot.start_time
  }, [])

  return {
    // Data
    timeSlots,
    groupedSlots,
    selectedSlot,
    selectedSlotData: selectedSlot ? getSlotById(selectedSlot) : null,
    
    // State
    loading,
    error,
    
    // Stats
    stats,
    
    // Actions
    selectSlot,
    clearSelection,
    refetch: fetchTimeSlots,
    retry,
    clearError,
    
    // Helpers
    getSlotById,
    formatSlotTime,
    isEmpty: timeSlots.length === 0 && !loading,
    hasSelection: !!selectedSlot,
  }
}