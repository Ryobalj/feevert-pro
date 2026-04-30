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
import DropdownButton from './navbar/DropdownButton'
import DropdownContent from './navbar/DropdownContent'
import MobileDropdown from './navbar/MobileDropdown'
import MobileServicesMenu from './navbar/MobileServicesMenu'
import ServicesMegaMenu from './navbar/ServicesMegaMenu'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [serviceCategories, setServiceCategories] = useState([])
  const [servicesTree, setServicesTree] = useState([])
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, projectsRes] = await Promise.all([
          api.get('/consultation-categories/'),
          api.get('/project-categories/')
        ])
        setServiceCategories(servicesRes.data?.results || servicesRes.data || [])
        setProjectCategories(projectsRes.data?.results || projectsRes.data || [])
      } catch (e) { console.error('Error fetching nav data:', e) }
    }
    fetchData()
  }, [])

  useEffect(() => {
    api.get('/consultation-categories/tree/')
      .then(res => setServicesTree(res.data || []))
      .catch(() => {})
  }, [])

  // Unread counts
  useEffect(() => {
    if (!isAuthenticated) return
    const fetch = async () => {
      try {
        const [n, m] = await Promise.all([
          api.get('/notifications/unread-count/').catch(() => ({ data: { unread_count: 0 } })),
          api.get('/unread-count/').catch(() => ({ data: { unread_count: 0 } }))
        ])
        setTotalUnreadNotifications(n.data?.unread_count || 0)
        setTotalUnreadMessages(m.data?.unread_count || 0)
      } catch (e) {}
    }
    fetch()
    const i = setInterval(fetch, 30000)
    return () => clearInterval(i)
  }, [isAuthenticated])

  // Scroll
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Close on route change
  useEffect(() => { setIsOpen(false); setOpenDropdown(null) }, [location])

  useEffect(() => () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current) }, [])

  // Handlers
  const handleDropdownEnter = (name) => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null }
    const btn = buttonRefs.current[name]
    if (btn) {
      const r = btn.getBoundingClientRect()
      setDropdownPosition({ top: r.bottom + 8, left: name === 'user' ? Math.max(r.right - 260, 0) : r.left })
    }
    currentDropdownRef.current = name
    setOpenDropdown(name)
  }

  const handleDropdownLeave = (e) => {
    if (e.relatedTarget?.closest('.dropdown-menu-container')) return
    closeTimeoutRef.current = setTimeout(() => { setOpenDropdown(null); currentDropdownRef.current = null }, 150)
  }

  const megaEnter = () => { if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null } }
  const megaLeave = () => { closeTimeoutRef.current = setTimeout(() => { setOpenDropdown(null); currentDropdownRef.current = null }, 200) }

  const toggleLanguage = () => {
    const l = i18n.language === 'en' ? 'sw' : 'en'
    i18n.changeLanguage(l)
    localStorage.setItem('language', l)
  }

  const handleLogout = () => { logout(); navigate('/'); setOpenDropdown(null); setActiveModal(null) }

  // Menus
  const companyMenu = [
    { path: '/about', label: 'About Us' }, { path: '/team', label: 'Our Team' },
    { path: '/careers', label: 'Careers' }, { divider: true },
    { path: '/partners', label: 'Partners' }, { path: '/reviews', label: 'Reviews' },
  ]

  const projectsMenu = [
    { path: '/projects', label: 'All Projects' },
    ...(projectCategories.length > 0 ? [{ divider: true }] : []),
    ...projectCategories.map(c => ({ path: `/projects?category=${c.slug || c.id}`, label: c.name })),
  ]

  const resourcesMenu = [
    { path: '/news', label: 'News & Updates' }, { path: '/faq', label: 'FAQ' },
    { divider: true }, { path: '/contact', label: 'Contact Us' },
  ]

  const userMenuItems = isAuthenticated ? [
    { label: user?.full_name || user?.username || 'User', type: 'header', email: user?.email }, { divider: true },
    { path: '/profile', label: 'Your Profile', icon: '👤' }, { path: '/dashboard', label: 'Dashboard', icon: '📊' }, { divider: true },
    { path: '/my-bookings', label: 'My Bookings', icon: '📅' }, { path: '/consultations', label: 'My Consultations', icon: '💬' },
    { path: '/payment-history', label: 'Payment History', icon: '💳' },
    { path: '/notifications', label: 'Notifications', icon: '🔔', badge: totalUnreadNotifications },
    { action: 'chat', label: 'Messages', icon: '💭', badge: totalUnreadMessages, onClick: () => { setActiveModal('chat'); setOpenDropdown(null) } },
    { action: 'support', label: 'Support', icon: '🛟', onClick: () => { setActiveModal('support'); setOpenDropdown(null) } },
    { divider: true }, { path: '/settings', label: 'Settings', icon: '⚙️' },
    { action: 'logout', label: 'Sign out', icon: '🚪', danger: true },
  ] : [
    { path: '/login', label: 'Sign in', icon: '🔐' }, { path: '/register', label: 'Sign up', icon: '📝' },
  ]

  const getDropdownItems = (name) => {
    switch(name) {
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
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'glass-nav shadow-sm' : 'bg-transparent'}`}
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center flex-shrink-0 mr-2">
              {!imgError ? (
                <img src="/logo-2520.png" alt="FeeVert" className="h-8 md:h-10 w-auto object-contain" onError={() => setImgError(true)} />
              ) : <span className="text-xl font-bold gradient-text">FeeVert</span>}
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex flex-1 mx-2 justify-center">
              <nav className="flex items-center gap-1">
                <Link to="/home" className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${location.pathname === '/home' ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)]' : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'}`}>Home</Link>
                <DropdownButton name="company" label="Company" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="services" label="Services" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="projects" label="Projects" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="resources" label="Resources" onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
              </nav>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={toggleDarkMode} className="btn-icon btn-circle btn-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {darkMode ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
                </svg>
              </button>
              <button onClick={toggleLanguage} className="hidden sm:flex items-center px-3 py-1.5 text-xs font-semibold rounded-full glass">{i18n.language === 'en' ? 'SW' : 'EN'}</button>
              <DropdownButton name="user" label={<span className="flex items-center gap-1 relative"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{isAuthenticated && totalBadge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5">{totalBadge > 9 ? '9+' : totalBadge}</span>}<span className="hidden lg:inline text-sm ml-1">{isAuthenticated ? (user?.username || 'Account') : 'Sign in'}</span></span>} onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
              <button onClick={() => setIsOpen(!isOpen)} className="btn-icon md:hidden">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div className="md:hidden card-glass mx-4 rounded-b-2xl border-t border-[var(--g-border-glass)]" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <div className="px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
                <Link to="/home" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>Home</Link>
                <MobileDropdown label="Company" items={companyMenu} onClose={() => setIsOpen(false)} />
                <MobileServicesMenu categories={serviceCategories} tree={servicesTree} onClose={() => setIsOpen(false)} />
                <MobileDropdown label="Projects" items={projectsMenu} onClose={() => setIsOpen(false)} />
                <MobileDropdown label="Resources" items={resourcesMenu} onClose={() => setIsOpen(false)} />
                
                <div className="divider-glass my-3" />
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-sm font-semibold text-[var(--g-text-primary)]">{user?.full_name || user?.username}</div>
                    <div className="px-4 py-1 text-xs text-[var(--g-text-tertiary)] mb-2">{user?.email}</div>
                    {['Profile','Dashboard','My Bookings','My Consultations','Payment History'].map((l,i) => (
                      <Link key={l} to={`/${l.toLowerCase().replace(/\s/g,'-')}`} className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>{['👤','📊','📅','💬','💳'][i]} {l}</Link>
                    ))}
                    <Link to="/notifications" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>🔔 Notifications {totalUnreadNotifications > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadNotifications}</span>}</Link>
                    <button onClick={() => { setActiveModal('chat'); setIsOpen(false) }} className="w-full text-left px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] flex items-center gap-3">💭 Messages {totalUnreadMessages > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadMessages}</span>}</button>
                    <button onClick={() => { setActiveModal('support'); setIsOpen(false) }} className="w-full text-left px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] flex items-center gap-3">🛟 Support</button>
                    <Link to="/settings" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)]" onClick={() => setIsOpen(false)}>⚙️ Settings</Link>
                    <button onClick={() => { handleLogout(); setIsOpen(false) }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl mt-2 font-medium">🚪 Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block w-full text-center px-4 py-3 mb-2 btn-primary rounded-xl" onClick={() => setIsOpen(false)}>Sign in</Link>
                    <Link to="/register" className="block w-full text-center px-4 py-3 btn-outline rounded-xl" onClick={() => setIsOpen(false)}>Sign up</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Portals */}
      {openDropdown === 'services' && createPortal(<ServicesMegaMenu tree={servicesTree} categories={serviceCategories} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      {openDropdown && openDropdown !== 'user' && openDropdown !== 'services' && createPortal(<DropdownContent items={getDropdownItems(openDropdown)} position={dropdownPosition} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      {openDropdown === 'user' && createPortal(<UserDropdownMenu items={userMenuItems} position={dropdownPosition} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onLogout={handleLogout} navigate={navigate} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      
      {activeModal === 'chat' && <div className="chat-modal fixed bottom-24 right-6 z-50"><UserChatList isModal onClose={() => setActiveModal(null)} /></div>}
      {activeModal === 'support' && <div className="chat-modal fixed bottom-24 right-6 z-50"><ChatBox recipientId={1} recipientName="FeeVert Support" onClose={() => setActiveModal(null)} /></div>}
    </>
  )
}

export default Navbar