// src/components/layout/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../features/accounts/hooks/useAuth'
import UserDropdownMenu from './UserDropdownMenu'
import ChatBox from '../../features/realtime/components/ChatBox'
import UserChatList from '../../features/realtime/components/UserChatList'
import api from '../../app/api'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [serviceCategories, setServiceCategories] = useState([])
  const [projectCategories, setProjectCategories] = useState([])
  const [imgError, setImgError] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [totalUnreadNotifications, setTotalUnreadNotifications] = useState(0)
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0)
  const closeTimeoutRef = useRef(null)
  const buttonRefs = useRef({})
  const currentDropdownRef = useRef(null)
  
  const { i18n } = useTranslation()
  const { darkMode, toggleDarkMode } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [servicesRes, projectsRes] = await Promise.all([
          api.get('/consultation-categories/'),
          api.get('/project-categories/')
        ])
        setServiceCategories(servicesRes.data?.results || servicesRes.data || [])
        setProjectCategories(projectsRes.data?.results || projectsRes.data || [])
      } catch (error) {
        console.error('Error fetching dropdown data:', error)
      }
    }
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    
    const fetchUnreadCounts = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          api.get('/notifications/unread-count/').catch(() => ({ data: { unread_count: 0 } })),
          api.get('/unread-count/').catch(() => ({ data: { unread_count: 0 } }))
        ])
        setTotalUnreadNotifications(notifRes.data?.unread_count || 0)
        setTotalUnreadMessages(msgRes.data?.unread_count || 0)
      } catch (error) {
        console.error('Error fetching unread counts:', error)
      }
    }
    
    fetchUnreadCounts()
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setOpenDropdown(null)
  }, [location])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeModal && !e.target.closest('.chat-modal') && !e.target.closest('.user-dropdown')) {
        setActiveModal(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeModal])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const handleDropdownEnter = (name) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    
    const button = buttonRefs.current[name]
    if (button) {
      const rect = button.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: name === 'user' ? rect.right - 260 : rect.left
      })
    }
    currentDropdownRef.current = name
    setOpenDropdown(name)
  }

  const handleDropdownLeave = (e) => {
    const relatedTarget = e.relatedTarget
    if (relatedTarget && relatedTarget.closest('.dropdown-menu-container')) {
      return
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
      currentDropdownRef.current = null
    }, 150)
  }

  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleDropdownMouseLeave = (e) => {
    const relatedTarget = e.relatedTarget
    const currentDropdownName = currentDropdownRef.current
    
    if (!currentDropdownName) {
      closeTimeoutRef.current = setTimeout(() => {
        setOpenDropdown(null)
      }, 150)
      return
    }
    
    const button = buttonRefs.current[currentDropdownName]
    
    if (relatedTarget && button && (relatedTarget === button || button.contains(relatedTarget))) {
      return
    }
    
    if (relatedTarget && relatedTarget.closest('.dropdown-button-wrapper')) {
      return
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
      currentDropdownRef.current = null
    }, 150)
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'sw' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setOpenDropdown(null)
    setActiveModal(null)
    currentDropdownRef.current = null
  }

  const servicesMenu = [
    { path: '/services', label: 'All Services' },
    { divider: true },
    ...serviceCategories.map(cat => ({ 
      path: `/services?category=${cat.slug || cat.id}`, 
      label: cat.name 
    })),
    { divider: true },
    { path: '/request-consultation', label: 'Request Consultation' },
  ]

  const projectsMenu = [
    { path: '/projects', label: 'All Projects' },
    { divider: true },
    ...projectCategories.map(cat => ({ 
      path: `/projects?category=${cat.slug || cat.id}`, 
      label: cat.name 
    })),
  ]

  const companyMenu = [
    { path: '/about', label: 'About Us' },
    { path: '/team', label: 'Our Team' },
    { path: '/careers', label: 'Careers' },
    { divider: true },
    { path: '/partners', label: 'Partners' },
    { path: '/reviews', label: 'Reviews' },
  ]

  const resourcesMenu = [
    { path: '/news', label: 'News & Updates' },
    { path: '/faq', label: 'FAQ' },
    { divider: true },
    { path: '/contact', label: 'Contact Us' },
  ]

  const userMenuItems = isAuthenticated ? [
    { 
      label: user?.full_name || user?.username || 'User',
      type: 'header',
      email: user?.email
    },
    { divider: true },
    { path: '/profile', label: 'Your Profile', icon: '👤' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { divider: true },
    { path: '/my-bookings', label: 'My Bookings', icon: '📅' },
    { path: '/consultations', label: 'My Consultations', icon: '💬' },
    { path: '/payment-history', label: 'Payment History', icon: '💳' },
    { path: '/notifications', label: 'Notifications', icon: '🔔', badge: totalUnreadNotifications },
    { 
      action: 'chat', 
      label: 'Messages', 
      icon: '💭', 
      badge: totalUnreadMessages,
      onClick: () => {
        setActiveModal('chat')
        setOpenDropdown(null)
        currentDropdownRef.current = null
      }
    },
    { 
      action: 'support', 
      label: 'Support', 
      icon: '🛟',
      onClick: () => {
        setActiveModal('support')
        setOpenDropdown(null)
        currentDropdownRef.current = null
      }
    },
    { divider: true },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { action: 'logout', label: 'Sign out', icon: '🚪', danger: true },
  ] : [
    { path: '/login', label: 'Sign in', icon: '🔐' },
    { path: '/register', label: 'Sign up', icon: '📝' },
  ]

  const getDropdownItems = (name) => {
    switch(name) {
      case 'services': return servicesMenu
      case 'projects': return projectsMenu
      case 'company': return companyMenu
      case 'resources': return resourcesMenu
      default: return []
    }
  }

  const totalBadge = totalUnreadNotifications + totalUnreadMessages

  return (
    <>
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass-nav shadow-sm' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0 mr-2">
              {!imgError ? (
                <img 
                  src="/logo-2520.png" 
                  alt="FeeVert"
                  className="h-8 md:h-10 w-auto object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-xl font-bold gradient-text">FeeVert</span>
              )}
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 mx-2 overflow-x-auto hide-scrollbar justify-center">
              <nav className="flex items-center gap-1">
                <Link 
                  to="/home" 
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                    location.pathname === '/home' 
                      ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)]' 
                      : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                  }`}
                >
                  Home
                </Link>
                
                <DropdownButton name="services" label="Services" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="projects" label="Projects" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="company" label="Company" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="resources" label="Resources" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
              </nav>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode} 
                className="btn-icon btn-circle btn-sm"
                aria-label="Toggle dark mode"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {darkMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  )}
                </svg>
              </button>
              
              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage} 
                className="hidden sm:flex items-center px-3 py-1.5 text-xs font-semibold rounded-full glass transition-all duration-300 hover:border-[var(--g-color-primary)] hover:text-[var(--g-color-primary)]"
              >
                {i18n.language === 'en' ? 'SW' : 'EN'}
              </button>
              
              {/* User Menu Button */}
              <DropdownButton 
                name="user" 
                label={
                  <span className="flex items-center gap-1 relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {isAuthenticated && totalBadge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center animate-scale-bounce">
                        {totalBadge > 9 ? '9+' : totalBadge}
                      </span>
                    )}
                    <span className="hidden lg:inline text-sm ml-1">
                      {isAuthenticated ? (user?.username || 'Account') : 'Sign in'}
                    </span>
                  </span>
                } 
                onEnter={handleDropdownEnter} 
                onLeave={handleDropdownLeave} 
                buttonRefs={buttonRefs} 
                open={openDropdown} 
              />
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="btn-icon md:hidden"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden card-glass mx-4 rounded-b-2xl border-t border-[var(--g-border-glass)]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                <Link 
                  to="/home" 
                  className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" 
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                
                <MobileDropdown label="Services" items={servicesMenu} onClose={() => setIsOpen(false)} />
                <MobileDropdown label="Projects" items={projectsMenu} onClose={() => setIsOpen(false)} />
                <MobileDropdown label="Company" items={companyMenu} onClose={() => setIsOpen(false)} />
                <MobileDropdown label="Resources" items={resourcesMenu} onClose={() => setIsOpen(false)} />
                
                <div className="divider-glass my-3" />
                
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-sm font-semibold text-[var(--g-text-primary)]">
                      {user?.full_name || user?.username}
                    </div>
                    <div className="px-4 py-1 text-xs text-[var(--g-text-tertiary)] mb-2">
                      {user?.email}
                    </div>
                    <Link to="/profile" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>👤 Your Profile</Link>
                    <Link to="/dashboard" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>📊 Dashboard</Link>
                    <Link to="/my-bookings" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>📅 My Bookings</Link>
                    <Link to="/consultations" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>💬 My Consultations</Link>
                    <Link to="/payment-history" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>💳 Payment History</Link>
                    <Link to="/notifications" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>
                      🔔 Notifications
                      {totalUnreadNotifications > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadNotifications}</span>
                      )}
                    </Link>
                    <button 
                      onClick={() => { setActiveModal('chat'); setIsOpen(false) }} 
                      className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] flex items-center gap-3"
                    >
                      💭 Messages
                      {totalUnreadMessages > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadMessages}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => { setActiveModal('support'); setIsOpen(false) }} 
                      className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] flex items-center gap-3"
                    >
                      🛟 Support
                    </button>
                    <Link to="/settings" className="block px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>⚙️ Settings</Link>
                    <button onClick={() => { handleLogout(); setIsOpen(false) }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl mt-2 transition-colors font-medium">🚪 Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block w-full text-center px-4 py-3 mb-2 btn-primary rounded-xl transition-all" onClick={() => setIsOpen(false)}>Sign in</Link>
                    <Link to="/register" className="block w-full text-center px-4 py-3 btn-outline rounded-xl transition-all" onClick={() => setIsOpen(false)}>Sign up</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Dropdown Portals */}
      {openDropdown && openDropdown !== 'user' && createPortal(
        <DropdownContent 
          items={getDropdownItems(openDropdown)} 
          position={dropdownPosition}
          onClose={() => {
            setOpenDropdown(null)
            currentDropdownRef.current = null
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        />,
        document.body
      )}
      
      {openDropdown === 'user' && createPortal(
        <UserDropdownMenu 
          items={userMenuItems} 
          position={dropdownPosition}
          onClose={() => {
            setOpenDropdown(null)
            currentDropdownRef.current = null
          }}
          onLogout={handleLogout}
          navigate={navigate}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        />,
        document.body
      )}
      
      {/* Chat Modals */}
      {activeModal === 'chat' && (
        <div className="chat-modal fixed bottom-24 right-6 z-50 animate-fade-in-up">
          <UserChatList isModal onClose={() => setActiveModal(null)} />
        </div>
      )}
      
      {activeModal === 'support' && (
        <div className="chat-modal fixed bottom-24 right-6 z-50 animate-fade-in-up">
          <ChatBox 
            recipientId={1} 
            recipientName="FeeVert Support"
            onClose={() => setActiveModal(null)}
          />
        </div>
      )}
    </>
  )
}

// Dropdown Button Component
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
      >
        ▼
      </motion.span>
    </button>
  </div>
)

// Dropdown Content Component (Portal)
const DropdownContent = ({ items, position, onClose, onMouseEnter, onMouseLeave }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="fixed card-glass !p-1 shadow-lg overflow-hidden dropdown-menu-container z-[9999]"
      style={{
        top: position.top,
        left: position.left,
        minWidth: 220,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, index) => {
        if (item.divider) return <div key={index} className="h-px bg-[var(--g-border-glass)] my-1" />
        return (
          <Link 
            key={item.path} 
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
}

// Mobile Dropdown Component
const MobileDropdown = ({ label, items, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]"
      >
        {label}
        <motion.span 
          className="text-[10px]"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
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

export default Navbar