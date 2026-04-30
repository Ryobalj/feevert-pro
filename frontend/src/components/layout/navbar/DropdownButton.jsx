// src/components/layout/navbar/DropdownButton.jsx

import React from 'react'
import { motion } from 'framer-motion'

const DropdownButton = ({ name, label, onEnter, onLeave, buttonRefs, open }) => (
  <div 
    className="relative dropdown-button-wrapper"
    onMouseEnter={() => onEnter(name)}
    onMouseLeave={onLeave}
  >
    <button 
      ref={(el) => buttonRefs.current[name] = el}
      className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
        open === name 
          ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)]' 
          : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
      }`}
    >
      {label}
      <motion.span 
        className="text-[10px] ml-0.5"
        animate={{ rotate: open === name ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >▼</motion.span>
    </button>
  </div>
)

export default DropdownButton