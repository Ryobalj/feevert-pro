// src/components/layout/navbar/DropdownContent.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const DropdownContent = ({ items, position, onClose, onMouseEnter, onMouseLeave }) => (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.15 }}
    className="fixed card-glass !p-1 shadow-lg overflow-hidden dropdown-menu-container z-[9999]"
    style={{
      top: position.top,
      left: position.left,
      minWidth: 220,
      maxHeight: '60vh',
      overflowY: 'auto',
    }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {items.map((item, index) => {
      if (item.divider) return <div key={index} className="h-px bg-[var(--g-border-glass)] my-1" />
      return (
        <Link 
          key={item.path || index} 
          to={item.path} 
          className="block px-4 py-2.5 text-sm rounded-lg text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] transition-all duration-200"
          onClick={onClose}
        >
          {item.label}
        </Link>
      )
    })}
  </motion.div>
)

export default DropdownContent