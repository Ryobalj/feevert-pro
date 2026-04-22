// src/components/layout/UserDropdownMenu.jsx

import React, { useRef } from 'react'
import { motion } from 'framer-motion'

const UserDropdownMenu = ({ items, position, onClose, onLogout, navigate }) => {
  const closeTimeoutRef = useRef(null)

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleMouseLeave = (e) => {
    // Check if mouse is going to the user button
    const relatedTarget = e.relatedTarget
    if (relatedTarget && relatedTarget.closest('.dropdown-button')) {
      return // Don't close if mouse is moving to the button
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      onClose()
    }, 200)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="fixed glass rounded-xl shadow-xl border border-[var(--border-light)] overflow-hidden user-dropdown"
      style={{
        top: position.top,
        left: position.left,
        minWidth: 260,
        maxWidth: 280,
        zIndex: 9999
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item, index) => {
        if (item.divider) return <Divider key={index} />
        if (item.type === 'header') return <HeaderItem key={index} item={item} />
        if (item.action === 'logout') return <LogoutItem key={index} item={item} onLogout={onLogout} onClose={onClose} />
        if (item.action === 'chat' || item.action === 'support') return <ActionItem key={index} item={item} onClose={onClose} />
        return <MenuItem key={item.path || index} item={item} navigate={navigate} onClose={onClose} />
      })}
    </motion.div>
  )
}

const Divider = () => (
  <div className="h-px bg-[var(--border-light)] my-1" />
)

const HeaderItem = ({ item }) => (
  <div className="px-4 py-3">
    <div className="font-medium text-[var(--text-primary)] text-sm truncate">{item.label}</div>
    {item.email && <div className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">{item.email}</div>}
  </div>
)

const LogoutItem = ({ item, onLogout, onClose }) => (
  <button 
    onClick={() => { 
      onLogout() 
      onClose() 
    }} 
    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--border-light)] flex items-center gap-3 transition-colors ${
      item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-[var(--text-primary)]'
    }`}
  >
    <span className="text-base w-5 text-center">{item.icon}</span>
    <span className="flex-1">{item.label}</span>
  </button>
)

const MenuItem = ({ item, navigate, onClose }) => (
  <button
    onClick={() => { 
      navigate(item.path) 
      onClose() 
    }}
    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--border-light)] flex items-center gap-3 transition-colors text-[var(--text-primary)]"
  >
    <span className="text-base w-5 text-center">{item.icon}</span>
    <span className="flex-1">{item.label}</span>
    {item.badge > 0 && (
      <span className="bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center">
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    )}
  </button>
)

const ActionItem = ({ item, onClose }) => (
  <button 
    onClick={() => {
      if (item.onClick) item.onClick()
      onClose()
    }}
    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--border-light)] flex items-center gap-3 transition-colors text-[var(--text-primary)]"
  >
    <span className="text-base w-5 text-center">{item.icon}</span>
    <span className="flex-1">{item.label}</span>
    {item.badge > 0 && (
      <span className="bg-blue-600 text-white text-xs font-medium rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center">
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    )}
  </button>
)

export default UserDropdownMenu