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
  const [activeModal, setActiveModal] = useState(null) // 'chat', 'support', null
  const [totalUnreadNotifications, setTotalUnreadNotifications] = useState(0)
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0)
  const closeTimeoutRef = useRef(null)
  const buttonRefs = useRef({})
  
  const { i18n } = useTranslation()
  const { darkMode, toggleDarkMode } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Fetch dropdown data
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

  // Fetch unread counts
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

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
    setOpenDropdown(null)
  }, [location])

  // Click outside to close modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeModal && !e.target.closest('.chat-modal') && !e.target.closest('.user-dropdown')) {
        setActiveModal(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeModal])

  const handleDropdownEnter = (name) => {
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    
    const button = buttonRefs.current[name]
    if (button) {
      const rect = button.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: name === 'user' ? rect.right - 280 : rect.left
      })
    }
    setOpenDropdown(name)
  }

  const handleDropdownLeave = () => {
    // Longer delay to allow user to reach dropdown
    closeTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 300)
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
  }

  // Menu definitions
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

  // User dropdown items
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
      }
    },
    { 
      action: 'support', 
      label: 'Support', 
      icon: '🛟',
      onClick: () => {
        setActiveModal('support')
        setOpenDropdown(null)
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
          scrolled ? 'glass shadow-md' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-full px-4">
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
            <div className="hidden md:block flex-1 mx-2 overflow-x-auto scrollbar-hide">
              <nav className="flex items-center space-x-1 min-w-max">
                <Link 
                  to="/home" 
                  className={`nav-link px-3 py-2 text-sm font-medium whitespace-nowrap ${
                    location.pathname === '/home' 
                      ? 'text-[var(--primary)]' 
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Home
                </Link>
                
                <DropdownButton 
                  name="services" 
                  label="Services" 
                  onEnter={handleDropdownEnter} 
                  onLeave={handleDropdownLeave} 
                  buttonRefs={buttonRefs} 
                  open={openDropdown} 
                />
                <DropdownButton 
                  name="projects" 
                  label="Projects" 
                  onEnter={handleDropdownEnter} 
                  onLeave={handleDropdownLeave} 
                  buttonRefs={buttonRefs} 
                  open={openDropdown} 
                />
                <DropdownButton 
                  name="company" 
                  label="Company" 
                  onEnter={handleDropdownEnter} 
                  onLeave={handleDropdownLeave} 
                  buttonRefs={buttonRefs} 
                  open={openDropdown} 
                />
                <DropdownButton 
                  name="resources" 
                  label="Resources" 
                  onEnter={handleDropdownEnter} 
                  onLeave={handleDropdownLeave} 
                  buttonRefs={buttonRefs} 
                  open={openDropdown} 
                />
              </nav>
            </div>
            
            {/* Right Icons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)]"
                aria-label="Toggle dark mode"
              >
                <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
              </button>
              
              <button 
                onClick={toggleLanguage} 
                className="hidden sm:block px-2 py-1.5 text-xs font-medium rounded-full text-[var(--text-secondary)] border border-[var(--border-light)]"
              >
                {i18n.language === 'en' ? 'SW' : 'EN'}
              </button>
              
              {/* User Dropdown Button with Badge */}
              <DropdownButton 
                name="user" 
                label={
                  <span className="flex items-center gap-1 relative">
                    <span>{isAuthenticated ? '👤' : '🔐'}</span>
                    {isAuthenticated && totalBadge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {totalBadge > 9 ? '9+' : totalBadge}
                      </span>
                    )}
                    <span className="hidden lg:inline">
                      {isAuthenticated ? (user?.username || 'Account') : 'Sign in'}
                    </span>
                  </span>
                } 
                onEnter={handleDropdownEnter} 
                onLeave={handleDropdownLeave} 
                buttonRefs={buttonRefs} 
                open={openDropdown} 
              />
              
              <Link to="/contact" className="hidden lg:block">
                <button className="glow-button !py-1.5 !px-4 text-sm whitespace-nowrap">
                  Get Started
                </button>
              </Link>
              
              {/* Mobile menu button */}
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 md:hidden text-[var(--text-secondary)]"
                aria-label="Toggle menu"
              >
                <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden glass border-t border-[var(--border-light)]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                <Link 
                  to="/home" 
                  className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" 
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                
                <MobileDropdown 
                  label="Services" 
                  items={servicesMenu} 
                  onClose={() => setIsOpen(false)} 
                />
                <MobileDropdown 
                  label="Projects" 
                  items={projectsMenu} 
                  onClose={() => setIsOpen(false)} 
                />
                <MobileDropdown 
                  label="Company" 
                  items={companyMenu} 
                  onClose={() => setIsOpen(false)} 
                />
                <MobileDropdown 
                  label="Resources" 
                  items={resourcesMenu} 
                  onClose={() => setIsOpen(false)} 
                />
                
                <div className="border-t border-[var(--border-light)] my-3 pt-3">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
                        {user?.full_name || user?.username}
                      </div>
                      <div className="px-4 py-1 text-xs text-[var(--text-tertiary)] mb-2">
                        {user?.email}
                      </div>
                      <Link to="/profile" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Your Profile</Link>
                      <Link to="/dashboard" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Dashboard</Link>
                      <Link to="/my-bookings" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>My Bookings</Link>
                      <Link to="/consultations" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>My Consultations</Link>
                      <Link to="/payment-history" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Payment History</Link>
                      <Link to="/notifications" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Notifications</Link>
                      <button 
                        onClick={() => { setActiveModal('chat'); setIsOpen(false) }} 
                        className="w-full text-left px-4 py-3 hover:bg-[var(--border-light)] rounded-xl flex items-center gap-3"
                      >
                        <span>💭</span> Messages
                        {totalUnreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadMessages}</span>
                        )}
                      </button>
                      <button 
                        onClick={() => { setActiveModal('support'); setIsOpen(false) }} 
                        className="w-full text-left px-4 py-3 hover:bg-[var(--border-light)] rounded-xl flex items-center gap-3"
                      >
                        <span>🛟</span> Support
                      </button>
                      <Link to="/settings" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Settings</Link>
                      <button onClick={() => { handleLogout(); setIsOpen(false) }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl mt-2">Sign out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Sign in</Link>
                      <Link to="/register" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl" onClick={() => setIsOpen(false)}>Sign up</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Portal Dropdowns */}
      {openDropdown && openDropdown !== 'user' && createPortal(
        <DropdownContent 
          items={getDropdownItems(openDropdown)} 
          position={dropdownPosition}
          onClose={() => setOpenDropdown(null)}
        />,
        document.body
      )}
      
      {openDropdown === 'user' && createPortal(
        <UserDropdownMenu 
          items={userMenuItems} 
          position={dropdownPosition}
          onClose={() => setOpenDropdown(null)}
          onLogout={handleLogout}
          navigate={navigate}
        />,
        document.body
      )}
      
      {/* Modals */}
      {activeModal === 'chat' && (
        <div className="chat-modal fixed bottom-24 right-6 z-50">
          <UserChatList isModal onClose={() => setActiveModal(null)} />
        </div>
      )}
      
      {activeModal === 'support' && (
        <div className="chat-modal fixed bottom-24 right-6 z-50">
          <ChatBox 
            recipientId={1} 
            recipientName="FeeVert Support"
            onClose={() => setActiveModal(null)}
          />
        </div>
      )}
      
      <div className="h-16"></div>
    </>
  )
}

// ============================================
// DROPDOWN BUTTON COMPONENT
// ============================================
const DropdownButton = ({ name, label, onEnter, onLeave, buttonRefs, open }) => (
  <div 
    className="relative"
    onMouseEnter={() => onEnter(name)}
    onMouseLeave={onLeave}
  >
    <button 
      ref={(el) => buttonRefs.current[name] = el}
      className="dropdown-button flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] whitespace-nowrap transition-colors"
    >
      {label}
      <motion.span 
        className="text-xs"
        animate={{ rotate: open === name ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        ▼
      </motion.span>
    </button>
  </div>
)

// ============================================
// DROPDOWN CONTENT COMPONENT
// ============================================
const DropdownContent = ({ items, position, onClose }) => {
  const dropdownRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  
  // Only close dropdown if mouse leaves both dropdown and button
  const handleMouseLeave = (e) => {
    // Check if mouse is going to the button
    const relatedTarget = e.relatedTarget
    if (relatedTarget && relatedTarget.closest('.dropdown-button')) {
      return // Don't close if mouse is moving to button
    }
    onClose()
  }
  
  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="fixed glass rounded-xl shadow-xl border border-[var(--border-light)] overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        minWidth: 220,
        zIndex: 9999
      }}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => {
        // Cancel any pending close timeout when mouse enters dropdown
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
      }}
    >
      {items.map((item, index) => {
        if (item.divider) return <div key={index} className="h-px bg-[var(--border-light)] my-1" />
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className="block px-4 py-2.5 text-sm hover:bg-[var(--border-light)] transition-colors"
            onClick={onClose}
          >
            {item.label}
          </Link>
        )
      })}
    </motion.div>
  )
}

// ============================================
// MOBILE DROPDOWN COMPONENT
// ============================================
const MobileDropdown = ({ label, items, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--border-light)] rounded-xl"
      >
        {label}
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="ml-4 pl-4 border-l-2 border-[var(--primary)] space-y-1">
          {items.filter(i => !i.divider).map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className="block px-4 py-2 hover:bg-[var(--border-light)] rounded-lg" 
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Navbar