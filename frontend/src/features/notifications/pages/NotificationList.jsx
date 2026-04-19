import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }
    loadNotifications()
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true })
      setNotifications(notifications.map(n => n.id === id ? {...n, is_read: true} : n))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      setNotifications(notifications.map(n => ({...n, is_read: true})))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.is_read)

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Notifications
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {unreadCount} unread notifications
            </p>
          </motion.div>
          
          {unreadCount > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={markAllAsRead}
              className={`text-sm font-medium hover:underline ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}
            >
              Mark all as read
            </motion.button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6"
        >
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {filteredNotifications.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                variants={cardVariants}
                className={`modern-card p-4 cursor-pointer transition-all ${
                  !notification.is_read 
                    ? darkMode ? 'bg-gray-800 border-l-4 border-l-green-500' : 'bg-white border-l-4 border-l-green-500'
                    : darkMode ? 'bg-gray-800/60' : 'bg-white/60'
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    !notification.is_read ? 'bg-green-600' : 'bg-gray-400'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {notification.title || 'Notification'}
                      </h4>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    
                    {notification.type && (
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {notification.type}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`modern-card p-12 text-center ${
              darkMode ? 'bg-gray-800/80' : 'bg-white/80'
            }`}
          >
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              No {filter !== 'all' ? filter : ''} notifications.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default NotificationList
