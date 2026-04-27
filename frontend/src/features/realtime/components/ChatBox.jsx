// src/features/realtime/components/ChatBox.jsx

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'
import { useWebSocket } from '../hooks/useWebSocket'

const ChatBox = ({ recipientId, recipientName, onClose, onNewMessage }) => {
  const { user } = useAuth()
  const { isConnected, lastMessage, sendMessage } = useWebSocket()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  // Load message history
  useEffect(() => {
    if (!recipientId) return
    const loadMessages = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/messages/${recipientId}/`)
        setMessages(res.data || [])
      } catch (error) { console.error('Error loading messages:', error) }
      finally { setLoading(false) }
    }
    loadMessages()
    api.post(`/conversations/${recipientId}/read/`).catch(console.error)
  }, [recipientId])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_message') {
      const data = lastMessage.data || lastMessage
      if (data.sender_id === recipientId || data.sender_id === user?.id) {
        setMessages(prev => [...prev, {
          id: data.message_id || Date.now(),
          sender: data.sender_id, recipient: recipientId,
          message: lastMessage.message || data.message,
          created_at: new Date().toISOString(),
          is_sender: data.sender_id === user?.id
        }])
        if (data.sender_id === recipientId) {
          api.post(`/conversations/${recipientId}/read/`).catch(console.error)
        }
        if (onNewMessage) onNewMessage()
      }
    }
  }, [lastMessage, recipientId, user?.id])

  // Auto-scroll + focus input
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    inputRef.current?.focus()
  }, [messages])

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!inputMessage.trim()) return
    
    const messageText = inputMessage.trim()
    setInputMessage('')
    
    const tempMessage = {
      id: `temp-${Date.now()}`, sender: user.id, recipient: recipientId,
      message: messageText, created_at: new Date().toISOString(),
      is_sender: true, is_temp: true
    }
    setMessages(prev => [...prev, tempMessage])
    
    try {
      const res = await api.post('/send/', { recipient_id: recipientId, message: messageText })
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...res.data, is_sender: true } : msg
      ))
      if (isConnected) {
        sendMessage({ type: 'chat', recipient_id: recipientId, message: messageText, sender_id: user.id, sender_name: user.username })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    }
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      if (isConnected) sendMessage({ type: 'typing', recipient_id: recipientId, is_typing: true })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (isConnected) sendMessage({ type: 'typing', recipient_id: recipientId, is_typing: false })
    }, 1500)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-6 w-[380px] glass-card !p-0 z-50 flex flex-col overflow-hidden shadow-2xl"
      style={{ height: '520px' }}
    >
      {/* ============ HEADER ============ */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-emerald-500/10">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm ${isConnected ? 'ring-2 ring-emerald-400/50' : ''}`}>
              {(recipientName || 'U').charAt(0)}
            </div>
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#0d3320]" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{recipientName || 'Support'}</h3>
            <p className="text-[10px] text-white/50">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-7 h-7 rounded-full glass flex items-center justify-center hover:border-red-400/50 hover:text-red-400 transition-all duration-300"
          aria-label="Close chat"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ============ MESSAGES ============ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-2xl">💬</div>
            <p className="text-white/50 text-sm">No messages yet</p>
            <p className="text-white/30 text-xs mt-1">Send a message to start chatting</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-3">
                <span className="text-[10px] bg-white/5 text-white/40 px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              {msgs.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.is_sender ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.is_sender
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'glass text-white/80 rounded-bl-md'
                  } ${msg.is_temp ? 'opacity-60' : ''}`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.is_sender ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${msg.is_sender ? 'text-white/50' : 'text-white/30'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                      {msg.is_sender && (
                        <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {msg.is_temp ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : msg.is_read ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ============ TYPING INDICATOR ============ */}
      <AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-1">
            <p className="text-xs text-emerald-400/70 italic flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              Typing...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ INPUT ============ */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 glass text-white placeholder:text-white/25 rounded-full border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm"
            disabled={!isConnected}
          />
          <motion.button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}

export default ChatBox