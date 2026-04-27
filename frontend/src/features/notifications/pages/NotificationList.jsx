import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const NotificationList = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications/')
        setNotifications(res.data?.results || res.data || [])
      } catch (error) { console.error('Error loading notifications:', error) }
      finally { setLoading(false) }
    }
    loadNotifications()
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n))
    } catch (error) { console.error('Error marking as read:', error) }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      setNotifications(prev => prev.map(n => ({...n, is_read: true})))
    } catch (error) { console.error('Error marking all as read:', error) }
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.is_read)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const typeConfig = {
    email: { icon: '✉️', color: 'blue' },
    sms: { icon: '📱', color: 'green' },
    system: { icon: '🔔', color: 'purple' },
    booking: { icon: '📅', color: 'emerald' },
    payment: { icon: '💳', color: 'amber' },
    consultation: { icon: '💬', color: 'cyan' },
  }

  const filters = [
    { value: 'all', label: 'All', icon: '📋' },
    { value: 'unread', label: 'Unread', icon: '🔵' },
    { value: 'read', label: 'Read', icon: '✅' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl animate-pulse" />
            <div className="spinner spinner-lg relative" />
          </div>
          <p className="text-white/50 animate-pulse">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen py-10 md:py-16">
      <div className="container-main max-w-2xl">
        {/* ============ HEADER ============ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-1">
              <span className="gradient-text">Notifications</span>
            </h1>
            <p className="text-white/40 text-sm">
              {unreadCount > 0 
                ? <><span className="text-emerald-400 font-semibold">{unreadCount}</span> unread notifications</>
                : 'All caught up! 🎉'}
            </p>
          </motion.div>
          
          {unreadCount > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              onClick={markAllAsRead}
              className="glass px-5 py-2.5 rounded-full text-sm font-semibold text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/30 transition-all duration-300"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Mark all read
              </span>
            </motion.button>
          )}
        </div>

        {/* ============ FILTERS ============ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8">
          {filters.map(f => (
            <motion.button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                filter === f.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'glass text-white/60 hover:text-white hover:border-white/30'
              }`}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <span>{f.icon}</span>
              {f.label}
            </motion.button>
          ))}
        </motion.div>

        {/* ============ NOTIFICATIONS LIST ============ */}
        <AnimatePresence mode="wait">
          {filteredNotifications.length > 0 ? (
            <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3">
              {filteredNotifications.map((notification, index) => {
                const type = typeConfig[notification.notification_type || notification.type] || typeConfig.system
                const isUnread = !notification.is_read

                return (
                  <motion.div key={notification.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ x: 4 }}
                    onClick={() => isUnread && markAsRead(notification.id)}
                    className={`glass-card p-4 cursor-pointer transition-all duration-300 group ${
                      isUnread 
                        ? 'border-l-[3px] border-l-emerald-400 bg-emerald-400/[0.02]' 
                        : 'opacity-60 hover:opacity-80'
                    }`}>
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className={`w-9 h-9 rounded-xl bg-${type.color}-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-sm">{type.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">
                              {notification.title || 'Notification'}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] text-white/30 flex-shrink-0">
                            {notification.created_at 
                              ? new Date(notification.created_at).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                              : 'Just now'}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-1 line-clamp-2 leading-relaxed ${isUnread ? 'text-white/60' : 'text-white/40'}`}>
                          {notification.message}
                        </p>
                        
                        {/* Type badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40">
                            {type.icon} {notification.notification_type || notification.type || 'system'}
                          </span>
                          {isUnread && (
                            <span className="text-[10px] text-emerald-400 font-medium">New</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center">
              <div className="text-5xl mb-4 opacity-40">
                {filter === 'unread' ? '✅' : filter === 'read' ? '📭' : '🔔'}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </h3>
              <p className="text-white/40">
                {filter === 'all' ? 'You have no notifications yet.' :
                 filter === 'unread' ? 'You have no unread notifications.' :
                 'You have no read notifications.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default NotificationList