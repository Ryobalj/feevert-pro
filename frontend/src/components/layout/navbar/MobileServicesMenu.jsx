// src/components/layout/navbar/MobileServicesMenu.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getIcon } from './IconMap'

const MobileServicesMenu = ({ categories, tree, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedMain, setExpandedMain] = useState(null)
  const [expandedSub, setExpandedSub] = useState(null)

  const mainCategories = React.useMemo(() => {
    if (tree.length > 0) return tree
    return categories.filter(c => c.level === 0 && c.is_active)
  }, [tree, categories])

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]"
      >
        Services
        <motion.span className="text-[10px]" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ml-4 pl-4 border-l-2 border-[var(--g-color-primary)] space-y-1 max-h-[50vh] overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/services" onClick={onClose} className="block px-4 py-2.5 text-sm text-[var(--g-color-primary)] font-medium">🛠️ All Services</Link>
            <Link to="/request-consultation" onClick={onClose} className="block px-4 py-2.5 text-sm text-[var(--g-color-primary)] font-medium">📋 Request Consultation</Link>
            
            <div className="h-px bg-[var(--g-border-glass)] my-1" />
            
            {mainCategories.map(main => (
              <div key={main.id}>
                <button
                  onClick={() => {
                    setExpandedMain(expandedMain === main.id ? null : main.id)
                    setExpandedSub(null)
                  }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] rounded-lg"
                >
                  <span>{getIcon(main.icon)} {main.name}</span>
                  <motion.span className="text-[10px]" animate={{ rotate: expandedMain === main.id ? 180 : 0 }}>▼</motion.span>
                </button>
                
                {expandedMain === main.id && main.children?.length > 0 && (
                  <div className="ml-4 pl-3 border-l border-[var(--g-border-glass)]">
                    {main.children.map(sub => (
                      <div key={sub.id}>
                        <button
                          onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                          className="flex items-center justify-between w-full px-3 py-2 text-xs text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] rounded-lg"
                        >
                          {sub.name}
                          <motion.span className="text-[10px]" animate={{ rotate: expandedSub === sub.id ? 180 : 0 }}>▼</motion.span>
                        </button>
                        
                        {expandedSub === sub.id && sub.services?.length > 0 && (
                          <div className="ml-4 pl-3 border-l border-[var(--g-border-glass)]">
                            {sub.services.map(svc => (
                              <Link
                                key={svc.id}
                                to={`/services/${svc.id}`}
                                onClick={onClose}
                                className="block px-3 py-2 text-xs text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] rounded-lg"
                              >
                                {getIcon(svc.icon)} {svc.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileServicesMenu