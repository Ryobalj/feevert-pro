// src/features/realtime/components/UserChatList.jsx

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'
import ChatBox from './ChatBox'

const UserChatList = ({ isModal, onClose }) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeChat, setActiveChat] = useState(null)
  const [view, setView] = useState('conversations')
  const [loading, setLoading] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const searchInputRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!user) return
    
    const loadData = async () => {
      try {
        const [convRes, unreadRes] = await Promise.all([
          api.get('/conversations/'),
          api.get('/unread-count/')
        ])
        setConversations(convRes.data || [])
        setTotalUnread(unreadRes.data?.unread_count || 0)
      } catch (error) {
        console.error('Error loading conversations:', error)
      }
    }
    
    loadData()
    
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Click outside to close (for modal mode)
  useEffect(() => {
    if (!isModal || !onClose) return
    
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isModal, onClose])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allUsers.filter(u => 
        (u.full_name || u.username).toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.role_name || '').toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, allUsers])

  const loadAllUsers = async () => {
    if (allUsers.length > 0) return
    
    setLoading(true)
    try {
      const res = await api.get('/users/')
      const users = res.data.results || res.data || []
      const otherUsers = users.filter(u => u.id !== user?.id)
      setAllUsers(otherUsers)
      setFilteredUsers(otherUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      if (view === 'users') {
        loadAllUsers()
      }
      setTimeout(() => {
        if (view === 'users' && searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }
  }

  const startChat = (chatUser) => {
    setActiveChat({
      id: chatUser.user_id || chatUser.id,
      name: chatUser.full_name || chatUser.username,
      profile_picture: chatUser.profile_picture
    })
    setIsOpen(false)
    if (onClose) onClose()
    
    setOnlineUsers(prev => new Set([...prev, chatUser.user_id || chatUser.id]))
  }

  const closeChat = () => {
    setActiveChat(null)
  }

  const refreshConversations = async () => {
    try {
      const [convRes, unreadRes] = await Promise.all([
        api.get('/conversations/'),
        api.get('/unread-count/')
      ])
      setConversations(convRes.data || [])
      setTotalUnread(unreadRes.data?.unread_count || 0)
    } catch (error) {
      console.error('Error refreshing conversations:', error)
    }
  }

  const handleTabChange = (newView) => {
    setView(newView)
    setSearchQuery('')
    if (newView === 'users') {
      loadAllUsers()
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Modal Mode - No floating button
  if (isModal) {
    return (
      <>
        <div 
          ref={panelRef}
          className="w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fas fa-comment-dots text-blue-600"></i>
                Messages
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => handleTabChange('conversations')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  view === 'conversations'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <i className="fas fa-history mr-1"></i>
                Chats
                {totalUnread > 0 && (
                  <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('users')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  view === 'users'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <i className="fas fa-user-plus mr-1"></i>
                New Chat
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {view === 'users' && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Loading...</p>
              </div>
            ) : view === 'conversations' ? (
              conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-comment-slash text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">No conversations yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start chatting with someone!</p>
                  <button
                    onClick={() => handleTabChange('users')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Start a new chat
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => startChat(conv)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-medium">
                          {conv.profile_picture ? (
                            <img src={conv.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span>{getInitials(conv.full_name || conv.username)}</span>
                          )}
                        </div>
                        {(conv.is_online || onlineUsers.has(conv.user_id)) && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {conv.full_name || conv.username}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatLastSeen(conv.last_message_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {conv.last_message || 'Tap to start chatting'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-medium rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0 ml-2">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-users-slash text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    {searchQuery ? 'No users found' : 'No users available'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => startChat(u)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white font-medium">
                        {u.profile_picture ? (
                          <img src={u.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{getInitials(u.full_name || u.username)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white truncate block">
                          {u.full_name || u.username}
                        </span>
                        {u.role_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{u.role_name}</span>
                        )}
                      </div>
                      <i className="fas fa-comment-dots text-blue-600 dark:text-blue-400"></i>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Active Chat Box */}
        <AnimatePresence>
          {activeChat && (
            <ChatBox
              key={activeChat.id}
              recipientId={activeChat.id}
              recipientName={activeChat.name}
              onClose={closeChat}
              onNewMessage={refreshConversations}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  // Floating Mode (original)
  return (
    <>
      <button
        onClick={handleOpen}
        data-chat-toggle
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl hover:scale-105 transition-all z-40"
        aria-label="Open chat"
      >
        <i className="fas fa-comments text-xl"></i>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-lg animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-6 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Same content as modal mode */}
            {/* ... copy the same header, tabs, search, content from above ... */}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChat && (
          <ChatBox
            key={activeChat.id}
            recipientId={activeChat.id}
            recipientName={activeChat.name}
            onClose={closeChat}
            onNewMessage={refreshConversations}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default UserChatList