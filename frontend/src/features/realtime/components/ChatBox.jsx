import React, { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../../accounts/hooks/useAuth'

const ChatBox = ({ recipientId, recipientName }) => {
  const { isAuthenticated, user } = useAuth()
  const { isConnected, messages, sendMessage } = useWebSocket()
  const [inputMessage, setInputMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const messagesEndRef = useRef(null)

  // Filter messages for this chat
  useEffect(() => {
    if (messages.length > 0) {
      const relevantMessages = messages.filter(msg => 
        (msg.sender_id === recipientId && msg.recipient_id === user?.id) ||
        (msg.sender_id === user?.id && msg.recipient_id === recipientId)
      )
      setChatMessages(relevantMessages)
    }
  }, [messages, recipientId, user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !isConnected) return

    sendMessage({
      type: 'chat',
      recipient_id: recipientId,
      message: inputMessage,
      timestamp: new Date().toISOString()
    })
    setInputMessage('')
  }

  if (!isAuthenticated) return null

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-feevert-green rounded-full shadow-lg flex items-center justify-center text-white hover:bg-green-700 transition-all z-40"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-dots'} text-xl`}></i>
        {isConnected && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-feevert-green text-white p-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold">{recipientName || 'Support Team'}</h3>
                <p className="text-xs text-white/70">
                  {isConnected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <i className="fas fa-comment-dots text-3xl mb-2"></i>
                <p>No messages yet</p>
                <p className="text-xs mt-1">Send a message to start chatting</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl ${
                      msg.sender_id === user?.id
                        ? 'bg-feevert-green text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <span className={`text-xs mt-1 block ${msg.sender_id === user?.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:border-feevert-green focus:outline-none text-sm"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!isConnected || !inputMessage.trim()}
                className="w-10 h-10 bg-feevert-green rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
export default ChatBox
