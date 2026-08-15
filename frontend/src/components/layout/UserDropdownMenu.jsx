// src/components/layout/UserDropdownMenu.jsx

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const UserDropdownMenu = ({ 
  items, 
  position, 
  onClose, 
  onLogout, 
  navigate, 
  onMouseEnter, 
  onMouseLeave 
}) => {
  const dropdownRef = useRef(null)

  // How much room is left below the button.
  //
  // Two ways of asking, and the smaller answer wins. The pixel figure comes
  // from the same measurement that placed the menu, divided by the page zoom
  // (the text-size control sets `zoom` on <html>, and window.innerHeight does
  // not follow it while element rectangles do). `70vh` is the safety net: if
  // that arithmetic is ever off, a menu that is a little short still scrolls,
  // while one that is too tall goes back to hiding Sign out.
  const roomBelow = () => {
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1
    return Math.max(180, Math.round(window.innerHeight / zoom - position.top - 16))
  }
  const [maxHeight, setMaxHeight] = React.useState(() => `min(70vh, ${roomBelow()}px)`)

  useEffect(() => {
    const recalc = () => setMaxHeight(`min(70vh, ${roomBelow()}px)`)
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [position.top])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (e.target.closest('.dropdown-button-wrapper')) {
          return
        }
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      /* Scrollable, not clipped: at 125% or 150% display scaling the screen is
         short enough that the menu runs past the bottom, and `overflow-hidden`
         simply cut "Sign out" off with no way to reach it. */
      className="fixed card-glass !p-1 shadow-liquid overflow-y-auto overscroll-contain user-dropdown dropdown-menu-container z-[9999]"
      style={{
        top: position.top,
        left: position.left,
        minWidth: 260,
        maxWidth: 280,
        maxHeight,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, index) => {
        if (item.divider) return <div key={index} className="h-px bg-[var(--g-border-glass)] my-1" />
        if (item.type === 'header') return <HeaderItem key={index} item={item} />
        if (item.action === 'logout') return <LogoutItem key={index} item={item} onLogout={onLogout} onClose={onClose} />
        if (item.action === 'chat' || item.action === 'support') return <ActionItem key={index} item={item} onClose={onClose} />
        return <MenuItem key={item.path || index} item={item} navigate={navigate} onClose={onClose} />
      })}
    </motion.div>
  )
}

const HeaderItem = ({ item }) => (
  <div className="px-4 py-3">
    <div className="font-semibold text-white text-sm truncate">
      {item.label}
    </div>
    {item.email && (
      <div className="text-xs text-white/60 mt-0.5 truncate">
        {item.email}
      </div>
    )}
  </div>
)

const MenuItem = ({ item, navigate, onClose }) => (
  <button
    onClick={() => {
      navigate(item.path)
      onClose()
    }}
    className="w-full text-left px-4 py-2.5 text-sm rounded-lg hover:bg-white/5 flex items-center gap-3 transition-all duration-200 text-white/70 hover:text-white"
  >
    <span className="text-base w-5 text-center">{item.icon}</span>
    <span className="flex-1">{item.label}</span>
    {item.badge > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center">
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
    className="w-full text-left px-4 py-2.5 text-sm rounded-lg hover:bg-white/5 flex items-center gap-3 transition-all duration-200 text-white/70 hover:text-white"
  >
    <span className="text-base w-5 text-center">{item.icon}</span>
    <span className="flex-1">{item.label}</span>
    {item.badge > 0 && (
      <span className="bg-blue-600 text-white text-xs font-bold rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center">
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    )}
  </button>
)

const LogoutItem = ({ item, onLogout, onClose }) => (
  <button
    onClick={() => {
      onLogout()
      onClose()
    }}
    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-all duration-200 ${
      item.danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-white/70 hover:bg-white/5 hover:text-white'
    }`}
  >
    <span className="text-base w-5 text-center">{item.icon}</span>
    <span className="flex-1 font-medium">{item.label}</span>
  </button>
)

export default UserDropdownMenu