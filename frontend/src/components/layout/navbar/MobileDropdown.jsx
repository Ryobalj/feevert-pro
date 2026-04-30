// src/components/layout/navbar/MobileDropdown.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const MobileDropdown = ({ label, items, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]"
      >
        {label}
        <motion.span className="text-[10px]" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ml-4 pl-4 border-l-2 border-[var(--g-color-primary)] space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {items.filter(i => !i.divider).map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="block px-4 py-2 rounded-lg transition-all duration-200 text-sm text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" 
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileDropdown