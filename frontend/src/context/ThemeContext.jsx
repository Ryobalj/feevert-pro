// frontend/src/context/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ============ THEME CONFIGURATION ============
const THEMES = {
  white: {
    id: 'white',
    name: 'White Clean',
    icon: '⬜',
    description: 'Clean white with green headers',
    colors: {
      background: '#ffffff',
      surface: '#f8faf9',
      card: 'rgba(0,0,0,0.04)',
      text: '#1a1a2e',
      textSecondary: 'rgba(26,26,46,0.7)',
      textTertiary: 'rgba(26,26,46,0.4)',
      border: 'rgba(0,0,0,0.08)',
      primary: '#0d5c3e',
      primaryHover: '#1a7a54',
      accent: '#2d6a4f',
      navbarBg: 'rgba(255,255,255,0.95)',
      navbarText: '#0d5c3e',
      navbarTextHover: '#1a7a54',
      // ✅ Add landing page specific colors - FORCE WHITE TEXT
      landingText: '#ffffff',
      landingTextSecondary: 'rgba(255,255,255,0.7)',
      landingTextTertiary: 'rgba(255,255,255,0.4)',
    }
  },
  brand: {
    id: 'brand',
    name: 'Brand Green',
    icon: '💚',
    description: 'Rich brand green with gold accents',
    colors: {
      background: '#083a26',
      surface: '#0d5c3e',
      card: 'rgba(255,255,255,0.08)',
      text: '#f5f0e8',
      textSecondary: 'rgba(245,240,232,0.7)',
      textTertiary: 'rgba(245,240,232,0.4)',
      border: 'rgba(245,240,232,0.1)',
      primary: '#d4a843',
      primaryHover: '#e8c95a',
      accent: '#2d6a4f',
      navbarBg: 'rgba(8,58,38,0.9)',
      navbarText: '#d4a843',
      navbarTextHover: '#e8c95a',
      // ✅ Add landing page specific colors - FORCE WHITE TEXT
      landingText: '#ffffff',
      landingTextSecondary: 'rgba(255,255,255,0.7)',
      landingTextTertiary: 'rgba(255,255,255,0.4)',
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    icon: '🌙',
    description: 'Pure dark with emerald accents',
    colors: {
      background: '#000000',
      surface: '#0a0a0a',
      card: 'rgba(255,255,255,0.03)',
      text: '#e8e8e8',
      textSecondary: 'rgba(232,232,232,0.7)',
      textTertiary: 'rgba(232,232,232,0.4)',
      border: 'rgba(255,255,255,0.05)',
      primary: '#34d399',
      primaryHover: '#6ee7b7',
      accent: '#1a4a2e',
      navbarBg: 'rgba(10,10,10,0.85)',
      navbarText: '#34d399',
      navbarTextHover: '#6ee7b7',
      // ✅ Add landing page specific colors - FORCE WHITE TEXT
      landingText: '#ffffff',
      landingTextSecondary: 'rgba(255,255,255,0.7)',
      landingTextTertiary: 'rgba(255,255,255,0.4)',
    }
  }
}

// Order of themes (for toggle) - White kwanza
const THEME_ORDER = ['white', 'brand', 'dark']

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // DEFAULT: White Theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('feevert-theme')
    if (saved && THEMES[saved]) {
      return saved
    }
    return 'white'
  })

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return false
  })

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement
    const theme = THEMES[currentTheme]
    
    if (!theme) return

    root.setAttribute('data-theme', currentTheme)
    
    const colors = theme.colors
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--g-${key}`, value)
    })

    root.style.backgroundColor = colors.background
    root.style.color = colors.text

    const isDark = currentTheme === 'dark' || currentTheme === 'brand'
    if (isDark) {
      root.classList.add('dark')
      setDarkMode(true)
    } else {
      root.classList.remove('dark')
      setDarkMode(false)
    }

    localStorage.setItem('feevert-theme', currentTheme)
    localStorage.setItem('darkMode', String(isDark))
  }, [currentTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      const saved = localStorage.getItem('feevert-theme')
      if (!saved) {
        setCurrentTheme(e.matches ? 'dark' : 'white')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    const currentIndex = THEME_ORDER.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % THEME_ORDER.length
    setCurrentTheme(THEME_ORDER[nextIndex])
  }, [currentTheme])

  const setTheme = useCallback((themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId)
    }
  }, [])

  // ✅ Get landing page specific colors (always white text)
  const getLandingColors = useCallback(() => {
    const theme = THEMES[currentTheme]
    return {
      text: theme.colors.landingText || '#ffffff',
      textSecondary: theme.colors.landingTextSecondary || 'rgba(255,255,255,0.7)',
      textTertiary: theme.colors.landingTextTertiary || 'rgba(255,255,255,0.4)',
    }
  }, [currentTheme])

  const value = {
    currentTheme,
    theme: currentTheme,
    themes: THEMES,
    themeOrder: THEME_ORDER,
    darkMode,
    setTheme,
    toggleTheme,
    isDark: darkMode,
    isLight: !darkMode,
    colors: THEMES[currentTheme]?.colors || THEMES.white.colors,
    // ✅ Add landing page colors (always white)
    landingColors: getLandingColors(),
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext