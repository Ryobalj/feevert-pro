// src/features/bookings/hooks/useBookings.js

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../../app/api'

export const useBookings = (initialFilter = 'all') => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')

  // ============ FETCH BOOKINGS ============
  const fetchBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setError(null)
    
    try {
      const res = await api.get('/bookings/')
      const data = res.data?.results || res.data || []
      setBookings(Array.isArray(data) ? data : [])
      return data
    } catch (err) {
      console.error('Error loading bookings:', err)
      
      if (err.response?.status === 401) {
        setError('Please login to view your bookings')
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.')
      } else {
        setError('Failed to load bookings. Please try again.')
      }
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // ============ INITIAL LOAD ============
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // ============ FILTERED & SEARCHED BOOKINGS ============
  const filteredBookings = useMemo(() => {
    let result = bookings

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(b => b.status === filter)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(b => 
        b.service_name?.toLowerCase().includes(query) ||
        b.consultant_name?.toLowerCase().includes(query) ||
        b.notes?.toLowerCase().includes(query) ||
        b.status?.toLowerCase().includes(query)
      )
    }

    // Sort by date (newest first)
    return result.sort((a, b) => {
      const dateA = a.slot?.date ? new Date(a.slot.date) : new Date(0)
      const dateB = b.slot?.date ? new Date(b.slot.date) : new Date(0)
      return dateB - dateA
    })
  }, [bookings, filter, searchQuery])

  // ============ STATS ============
  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    upcoming: bookings.filter(b => {
      if (!b.slot?.date) return false
      return new Date(b.slot.date) >= new Date() && ['pending', 'confirmed'].includes(b.status)
    }).length,
  }), [bookings])

  // ============ ACTIONS ============
  const refetch = useCallback(() => {
    return fetchBookings(false)
  }, [fetchBookings])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearFilters = useCallback(() => {
    setFilter('all')
    setSearchQuery('')
  }, [])

  return {
    // Data
    bookings: filteredBookings,
    allBookings: bookings,
    
    // State
    loading,
    error,
    filter,
    searchQuery,
    
    // Stats
    stats,
    
    // Actions
    setFilter,
    setSearchQuery,
    refetch,
    clearError,
    clearFilters,
    
    // Helpers
    isEmpty: filteredBookings.length === 0 && !loading,
    hasActiveFilter: filter !== 'all' || searchQuery.trim() !== '',
  }
}