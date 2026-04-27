import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'
import { useWebSocket } from '../../realtime/hooks/useWebSocket'

const NotificationBell = () => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { lastMessage } = useWebSocket()

  // Load notifications
  useEffect(() => {
    if (!isAuthenticated) return
    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications/')
        const data = res.data.results || res.data
        const notifs = Array.isArray(data) ? data : []
        setNotifications(notifs.slice(0, 10))
        setUnreadCount(notifs.filter(n => !n.is_read).length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
    loadNotifications()
  }, [isAuthenticated])

  // WebSocket real-time
  useEffect(() => {
    if (lastMessage && isAuthenticated) {
      setNotifications(prev => [lastMessage, ...prev].slice(0, 10))
      setUnreadCount(prev => prev + 1)
    }
  }, [lastMessage, isAuthenticated])

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const typeConfig = {
    email: { icon: '✉️', bg: 'bg-blue-500/15', text: 'text-blue-400' },
    sms: { icon: '📱', bg: 'bg-green-500/15', text: 'text-green-400' },
    system: { icon: '🔔', bg: 'bg-purple-500/15', text: 'text-purple-400' },
    booking: { icon: '📅', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    payment: { icon: '💳', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full glass flex items-center justify-center hover:border-emerald-400/30 transition-all duration-300"
        aria-label="Notifications"
      >
        <motion.svg 
          className="w-5 h-5 text-white/70" 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </motion.svg>
        
        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 md:w-96 glass-card !p-0 overflow-hidden z-50 max-h-[480px] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg glass flex items-center justify-center text-xs">🔔</span>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            {/* List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3 opacity-30">🔕</div>
                  <p className="text-white/40 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const type = typeConfig[notif.notification_type] || typeConfig.system
                  return (
                    <motion.div
                      key={notif.id}
                      initial={!notif.is_read ? { backgroundColor: 'rgba(16, 185, 129, 0.05)' } : {}}
                      className={`p-4 border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-all duration-200 ${
                        !notif.is_read ? 'bg-emerald-400/[0.03]' : ''
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl ${type.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-sm">{type.icon}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-white text-sm truncate">{notif.title}</p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-white/25 mt-2">
                            {new Date(notif.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-white/5 text-center">
              <Link
                to="/notifications"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center justify-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell