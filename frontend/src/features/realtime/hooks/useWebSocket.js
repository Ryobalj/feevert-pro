// src/features/realtime/hooks/useWebSocket.js

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../accounts/hooks/useAuth'

export const useWebSocket = () => {
  const { isAuthenticated, user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [messages, setMessages] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // ============ CONNECT ============
  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return
    
    // Don't connect if already connected or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const token = localStorage.getItem('access_token')
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications/${token ? `?token=${token}` : ''}`
    
    try {
      wsRef.current = new WebSocket(wsUrl)
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setConnectionError('Failed to connect')
      return
    }

    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        wsRef.current?.close()
      }
    }, 10000)

    wsRef.current.onopen = () => {
      clearTimeout(connectionTimeout)
      console.log('🟢 WebSocket connected')
      setIsConnected(true)
      setConnectionError(null)
      reconnectAttemptsRef.current = 0
    }

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        setMessages(prev => [data, ...prev].slice(0, 50))
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionError('Connection error')
    }

    wsRef.current.onclose = (event) => {
      clearTimeout(connectionTimeout)
      console.log(`🔴 WebSocket disconnected (code: ${event.code})`)
      setIsConnected(false)
      
      // Only reconnect if not closed intentionally (code 1000)
      if (event.code !== 1000 && isAuthenticated) {
        attemptReconnect()
      }
    }
  }, [isAuthenticated, user])

  // ============ RECONNECT ============
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      setConnectionError('Unable to connect. Please refresh the page.')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff, max 30s
    
    console.log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
    
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++
      connect()
    }, delay)
  }, [connect])

  // ============ DISCONNECT ============
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      // Close with code 1000 (normal closure) to prevent auto-reconnect
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }
    
    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [])

  // ============ SEND MESSAGE ============
  const sendMessage = useCallback((data) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Message not sent.')
      return false
    }
    
    try {
      wsRef.current.send(JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }, [])

  // ============ MANUAL RECONNECT ============
  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    setConnectionError(null)
    setTimeout(connect, 300)
  }, [disconnect, connect])

  // ============ EFFECTS ============
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }
    
    return () => disconnect()
  }, [isAuthenticated, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounted')
      }
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    messages,
    connectionError,
    sendMessage,
    disconnect,
    reconnect,
    readyState: wsRef.current?.readyState,
  }
}