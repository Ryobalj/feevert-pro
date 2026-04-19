import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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

  // Load notifications from API
  useEffect(() => {
    if (!isAuthenticated) return

    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications/')
        const data = res.data.results || res.data
        const notifs = Array.isArray(data) ? data : []
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.is_read).length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
    loadNotifications()
  }, [isAuthenticated])

  // Receive real-time notifications via WebSocket
  useEffect(() => {
    if (lastMessage && isAuthenticated) {
      setNotifications(prev => [lastMessage, ...prev])
      setUnreadCount(prev => prev + 1)
    }
  }, [lastMessage, isAuthenticated])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => prev - 1)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-xl text-gray-700"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-feevert-green hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <i className="fas fa-bell-slash text-3xl mb-2 text-gray-300"></i>
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notif.is_read ? 'bg-feevert-light/30' : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="flex gap-3">
                  {/* Icon based on notification type */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notif.notification_type === 'email' ? 'bg-blue-100' : 
                      notif.notification_type === 'sms' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      <i className={`fas ${
                        notif.notification_type === 'email' ? 'fa-envelope' : 
                        notif.notification_type === 'sms' ? 'fa-mobile-alt' : 'fa-bell'
                      } text-sm ${
                        notif.notification_type === 'email' ? 'text-blue-600' : 
                        notif.notification_type === 'sms' ? 'text-green-600' : 'text-purple-600'
                      }`}></i>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-feevert-green rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Footer */}
          <div className="p-2 border-t border-gray-100 text-center">
            <Link
              to="/notifications"
              className="text-xs text-feevert-green hover:underline block py-1"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
