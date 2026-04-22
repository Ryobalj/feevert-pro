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
  const dropdownRef = useRef(null)
  
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
    setOpenDropdown(name)
  }

  const handleDropdownLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 200)
  }

  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleDropdownMouseLeave = (e) => {
    const relatedTarget = e.relatedTarget
    const button = buttonRefs.current[openDropdown]
    
    if (relatedTarget && button && (relatedTarget === button || button.contains(relatedTarget))) {
      return
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 200)
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
            
            <div className="hidden md:block flex-1 mx-2 overflow-x-auto scrollbar-hide">
              <nav className="flex items-center space-x-1 min-w-max">
                <Link 
                  to="/home" 
                  className={`nav-link px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    location.pathname === '/home' 
                      ? 'text-[var(--primary)]' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'
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
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                aria-label="Toggle dark mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {darkMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  )}
                </svg>
              </button>
              
              <button 
                onClick={toggleLanguage} 
                className="hidden sm:block px-2 py-1.5 text-xs font-medium rounded-full text-[var(--text-secondary)] border border-[var(--border-light)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
              >
                {i18n.language === 'en' ? 'SW' : 'EN'}
              </button>
              
              <DropdownButton 
                name="user" 
                label={
                  <span className="flex items-center gap-1 relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {isAuthenticated && totalBadge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center">
                        {totalBadge > 9 ? '9+' : totalBadge}
                      </span>
                    )}
                    <span className="hidden lg:inline text-sm">
                      {isAuthenticated ? (user?.username || 'Account') : 'Sign in'}
                    </span>
                  </span>
                } 
                onEnter={handleDropdownEnter} 
                onLeave={handleDropdownLeave} 
                buttonRefs={buttonRefs} 
                open={openDropdown} 
              />
              
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 md:hidden text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden glass border-t border-[var(--border-light)]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                <Link 
                  to="/home" 
                  className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" 
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
                      <Link to="/profile" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Your Profile</Link>
                      <Link to="/dashboard" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Dashboard</Link>
                      <Link to="/my-bookings" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>My Bookings</Link>
                      <Link to="/consultations" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>My Consultations</Link>
                      <Link to="/payment-history" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Payment History</Link>
                      <Link to="/notifications" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Notifications</Link>
                      <button 
                        onClick={() => { setActiveModal('chat'); setIsOpen(false) }} 
                        className="w-full text-left px-4 py-3 hover:bg-[var(--border-light)] rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <span className="text-base">💭</span> Messages
                        {totalUnreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadMessages}</span>
                        )}
                      </button>
                      <button 
                        onClick={() => { setActiveModal('support'); setIsOpen(false) }} 
                        className="w-full text-left px-4 py-3 hover:bg-[var(--border-light)] rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <span className="text-base">🛟</span> Support
                      </button>
                      <Link to="/settings" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Settings</Link>
                      <button onClick={() => { handleLogout(); setIsOpen(false) }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl mt-2 transition-colors">Sign out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Sign in</Link>
                      <Link to="/register" className="block px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Sign up</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {openDropdown && openDropdown !== 'user' && createPortal(
        <DropdownContent 
          items={getDropdownItems(openDropdown)} 
          position={dropdownPosition}
          onClose={() => setOpenDropdown(null)}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
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

const DropdownContent = ({ items, position, onClose, onMouseEnter, onMouseLeave }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="fixed glass rounded-xl shadow-xl border border-[var(--border-light)] overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        minWidth: 200,
        zIndex: 9999
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, index) => {
        if (item.divider) return <div key={index} className="h-px bg-[var(--border-light)] my-1" />
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className="block px-4 py-2 text-sm hover:bg-[var(--border-light)] transition-colors"
            onClick={onClose}
          >
            {item.label}
          </Link>
        )
      })}
    </motion.div>
  )
}

const MobileDropdown = ({ label, items, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--border-light)] rounded-xl transition-colors"
      >
        {label}
        <motion.span 
          className="text-xs"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ml-4 pl-4 border-l-2 border-[var(--primary)] space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {items.filter(i => !i.divider).map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="block px-4 py-2 hover:bg-[var(--border-light)] rounded-lg transition-colors" 
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