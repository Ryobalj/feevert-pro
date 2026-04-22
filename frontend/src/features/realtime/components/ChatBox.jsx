// src/features/realtime/components/ChatBox.jsx

import React, { useState, useEffect, useRef } from 'react'
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

  // Load message history
  useEffect(() => {
    if (!recipientId) return
    
    const loadMessages = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/messages/${recipientId}/`)
        setMessages(res.data || [])
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMessages()
    
    // Mark conversation as read
    api.post(`/conversations/${recipientId}/read/`).catch(console.error)
  }, [recipientId])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_message') {
      const data = lastMessage.data || lastMessage
      
      // Check if this message is from the current chat recipient
      if (data.sender_id === recipientId || data.sender_id === user?.id) {
        setMessages(prev => [...prev, {
          id: data.message_id || Date.now(),
          sender: data.sender_id,
          recipient: recipientId,
          message: lastMessage.message || data.message,
          created_at: new Date().toISOString(),
          is_sender: data.sender_id === user?.id
        }])
        
        // Mark as read if it's from the other user
        if (data.sender_id === recipientId) {
          api.post(`/conversations/${recipientId}/read/`).catch(console.error)
        }
        
        // Notify parent about new message
        if (onNewMessage) onNewMessage()
      }
    }
  }, [lastMessage, recipientId, user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    
    if (!inputMessage.trim()) return
    
    const messageText = inputMessage.trim()
    setInputMessage('')
    
    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender: user.id,
      recipient: recipientId,
      message: messageText,
      created_at: new Date().toISOString(),
      is_sender: true,
      is_temp: true
    }
    setMessages(prev => [...prev, tempMessage])
    
    try {
      const res = await api.post('/send/', {
        recipient_id: recipientId,
        message: messageText
      })
      
      // Replace temp message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...res.data, is_sender: true } : msg
      ))
      
      // Also send via WebSocket for realtime
      if (isConnected) {
        sendMessage({
          type: 'chat',
          recipient_id: recipientId,
          message: messageText,
          sender_id: user.id,
          sender_name: user.username
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      alert('Failed to send message. Please try again.')
    }
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      // Send typing indicator via WebSocket
      if (isConnected) {
        sendMessage({
          type: 'typing',
          recipient_id: recipientId,
          is_typing: true
        })
      }
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (isConnected) {
        sendMessage({
          type: 'typing',
          recipient_id: recipientId,
          is_typing: false
        })
      }
    }, 1500)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
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
    <div className="fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '500px' }}>
      {/* Header */}
      <div className="bg-green-600 dark:bg-green-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-sm"></i>
          </div>
          <div>
            <h3 className="font-semibold">{recipientName || 'User'}</h3>
            <p className="text-xs text-white/70">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close chat"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            <i className="fas fa-comment-dots text-3xl mb-2"></i>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Send a message to start chatting</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString([], { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              {/* Messages for this date */}
              {msgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_sender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl ${
                      msg.is_sender
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    } ${msg.is_temp ? 'opacity-70' : ''}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <span className={`text-xs mt-1 flex items-center gap-1 ${
                      msg.is_sender ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {formatTime(msg.created_at)}
                      {msg.is_sender && (
                        <i className={`fas fa-${msg.is_temp ? 'clock' : (msg.is_read ? 'check-double' : 'check')} text-xs`}></i>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
          Typing...
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-green-500 focus:outline-none text-sm"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatBox