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
  const [activeChat, setActiveChat] = useState(null)
  const [view, setView] = useState('conversations')
  const [loading, setLoading] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const panelRef = useRef(null)

  // Load conversations
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
      } catch (error) { console.error('Error loading conversations:', error) }
    }
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Click outside to close
  useEffect(() => {
    if (!isModal || !onClose) return
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isModal, onClose])

  // Filter users
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredUsers(allUsers); return }
    const q = searchQuery.toLowerCase()
    setFilteredUsers(allUsers.filter(u => 
      (u.full_name || u.username).toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role_name || '').toLowerCase().includes(q)
    ))
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
    } catch (error) { console.error('Error loading users:', error) }
    finally { setLoading(false) }
  }

  const startChat = (chatUser) => {
    setActiveChat({
      id: chatUser.user_id || chatUser.id,
      name: chatUser.full_name || chatUser.username,
    })
    if (onClose) onClose()
  }

  const closeChat = () => setActiveChat(null)

  const refreshConversations = async () => {
    try {
      const [convRes, unreadRes] = await Promise.all([
        api.get('/conversations/'),
        api.get('/unread-count/')
      ])
      setConversations(convRes.data || [])
      setTotalUnread(unreadRes.data?.unread_count || 0)
    } catch (error) { console.error('Error refreshing:', error) }
  }

  const handleTabChange = (newView) => {
    setView(newView)
    setSearchQuery('')
    if (newView === 'users') {
      loadAllUsers()
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }

  const formatLastSeen = (ts) => {
    if (!ts) return ''
    const mins = Math.floor((new Date() - new Date(ts)) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return new Date(ts).toLocaleDateString()
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
  }

  return (
    <>
      {/* ============ CHAT PANEL ============ */}
      <div ref={panelRef} className="w-96 max-w-full glass-card !p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg glass flex items-center justify-center text-xs">💬</span>
              Messages
            </h3>
            {onClose && (
              <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center hover:border-red-400/50 hover:text-red-400 transition-all duration-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 p-1 glass rounded-xl">
            <button onClick={() => handleTabChange('conversations')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-1 ${
                view === 'conversations' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white/80' }`}>
              💬 Chats
              {totalUnread > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{totalUnread > 9 ? '9+' : totalUnread}</span>}
            </button>
            <button onClick={() => handleTabChange('users')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-1 ${
                view === 'users' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white/80' }`}>
              👤 New Chat
            </button>
          </div>
        </div>

        {/* Search (Users view) */}
        {view === 'users' && (
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input ref={searchInputRef} type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner mx-auto mb-3" />
              <p className="text-white/40 text-sm">Loading...</p>
            </div>
          ) : view === 'conversations' ? (
            conversations.length === 0 ? (
              <EmptyState icon="💬" title="No conversations yet" subtitle="Start chatting with someone!" action="Start a new chat" onClick={() => handleTabChange('users')} />
            ) : (
              conversations.map((conv) => (
                <button key={conv.user_id} onClick={() => startChat(conv)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {conv.profile_picture ? <img src={conv.profile_picture} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(conv.full_name || conv.username)}
                    </div>
                    {conv.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-[#0d3320]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm truncate">{conv.full_name || conv.username}</span>
                      <span className="text-[10px] text-white/30">{formatLastSeen(conv.last_message_time)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-white/40 truncate">{conv.last_message || 'Tap to chat'}</p>
                      {conv.unread_count > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center">{conv.unread_count > 99 ? '99+' : conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          ) : (
            filteredUsers.length === 0 ? (
              <EmptyState icon="👤" title={searchQuery ? 'No users found' : 'No users available'} />
            ) : (
              filteredUsers.map((u) => (
                <button key={u.id} onClick={() => startChat(u)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {u.profile_picture ? <img src={u.profile_picture} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(u.full_name || u.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white text-sm block truncate">{u.full_name || u.username}</span>
                    {u.role_name && <span className="text-[10px] text-white/30">{u.role_name}</span>}
                  </div>
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* ============ ACTIVE CHAT BOX ============ */}
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

// ============ EMPTY STATE ============
const EmptyState = ({ icon, title, subtitle, action, onClick }) => (
  <div className="p-8 text-center">
    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl glass flex items-center justify-center text-2xl">{icon}</div>
    <p className="text-white/50 text-sm font-medium">{title}</p>
    {subtitle && <p className="text-white/30 text-xs mt-1">{subtitle}</p>}
    {action && (
      <button onClick={onClick} className="mt-4 bg-emerald-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-400 transition-colors">
        {action}
      </button>
    )}
  </div>
)

export default UserChatList