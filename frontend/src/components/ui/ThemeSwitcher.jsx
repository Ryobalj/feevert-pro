// src/components/ui/ThemeSwitcher.jsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const ThemeSwitcher = () => {
  const { t } = useTranslation('common')
  const { currentTheme, themes, setTheme, darkMode } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // ✅ Check if user is on landing page
  const isLandingPage = location.pathname === '/'

  // ✅ Force dark theme when on landing page
  useEffect(() => {
    if (isLandingPage && currentTheme !== 'dark') {
      // Store current theme before switching
      const previousTheme = localStorage.getItem('feevert-theme')
      if (previousTheme && previousTheme !== 'dark') {
        localStorage.setItem('feevert-theme-previous', previousTheme)
      }
      // Force dark theme
      setTheme('dark')
    }
  }, [isLandingPage, currentTheme, setTheme])

  // ✅ Restore previous theme when leaving landing page
  useEffect(() => {
    if (!isLandingPage) {
      const previousTheme = localStorage.getItem('feevert-theme-previous')
      if (previousTheme && previousTheme !== currentTheme) {
        setTheme(previousTheme)
        localStorage.removeItem('feevert-theme-previous')
      }
    }
  }, [isLandingPage, currentTheme, setTheme])

  // ✅ Always show dark theme icon on landing page
  const displayTheme = isLandingPage ? 'dark' : currentTheme
  const currentThemeData = themes[displayTheme]

  // ✅ Theme options with preview colors
  const themeOptions = [
    { id: 'white', label: t('nav.white'), icon: '☀️', color: '#ffffff' },
    { id: 'brand', label: t('nav.brand'), icon: '🌿', color: '#0d5c3e' },
    { id: 'dark', label: t('nav.dark'), icon: '🌙', color: '#0d3320' },
  ]

  return (
    <div className="relative z-[9999]">
      {/* Main Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          // ✅ Don't allow theme switching on landing page
          if (!isLandingPage) {
            setIsOpen(!isOpen)
          }
        }}
        className={`w-10 h-10 rounded-full glass flex items-center justify-center hover:border-emerald-400/30 transition-all duration-300 group ${
          isLandingPage ? 'cursor-not-allowed opacity-80' : ''
        }`}
        aria-label={t('theme.choose_theme')}
        title={isLandingPage ? t('theme.disabled_on_landing') || 'Theme switching disabled on landing page' : ''}
      >
        <span className="text-lg group-hover:scale-110 transition-transform duration-300">
          {displayTheme === 'white' ? '☀️' : displayTheme === 'brand' ? '🌿' : '🌙'}
        </span>
      </button>

      {/* ✅ Show lock icon on landing page */}
      {isLandingPage && (
        <div className="absolute -top-1 -right-1">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Dropdown - Only show if not on landing page */}
      <AnimatePresence>
        {isOpen && !isLandingPage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 w-56 glass-card p-2 shadow-2xl shadow-black/30 border border-[var(--g-border)]"
            style={{
              top: 'calc(100% + 8px)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              background: 'var(--g-background)',
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-[var(--g-border)]">
              <p className="text-xs font-semibold text-[var(--g-text-tertiary)] uppercase tracking-wider">
                {t('theme.choose_theme')}
              </p>
            </div>

            {/* Theme Options */}
            <div className="py-1">
              {themeOptions.map((option) => {
                const isActive = currentTheme === option.id
                const isDark = option.id === 'dark' || option.id === 'brand'
                
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setTheme(option.id)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                      isActive
                        ? isDark 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-emerald-500/15 text-emerald-600'
                        : isDark
                          ? 'text-[var(--g-text-secondary)] hover:text-[var(--g-text-primary)] hover:bg-[var(--g-liquid-secondary)]'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {/* Color Preview Circle */}
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        isActive ? 'border-emerald-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: option.color }}
                    />
                    
                    <span className="flex-1">{option.label}</span>
                    <span className="text-sm">{option.icon}</span>
                    
                    {isActive && (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Current Theme Info */}
            <div className="px-3 py-2 mt-1 border-t border-[var(--g-border)]">
              <p className="text-[10px] text-[var(--g-text-tertiary)]">
                {t('theme.current')}: <span className="text-[var(--g-text-secondary)]">{currentThemeData?.name}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemeSwitcher