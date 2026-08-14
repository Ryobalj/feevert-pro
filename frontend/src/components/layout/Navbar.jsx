// src/components/layout/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../features/accounts/hooks/useAuth'
import { useWebSocket } from '../../features/realtime/hooks/useWebSocket'
import UserDropdownMenu from './UserDropdownMenu'
import ChatBox from '../../features/realtime/components/ChatBox'
import UserChatList from '../../features/realtime/components/UserChatList'
import api from '../../app/api'
import DropdownButton from './navbar/DropdownButton'
import DropdownContent from './navbar/DropdownContent'
import MobileDropdown from './navbar/MobileDropdown'
import MobileServicesMenu from './navbar/MobileServicesMenu'
import ServicesMegaMenu from './navbar/ServicesMegaMenu'
import ProjectsMegaMenu from './navbar/ProjectsMegaMenu'
import MobileProjectsMenu from './navbar/MobileProjectsMenu'

// 🆕 SHOP - Cart Context & Drawer
import { useCart } from '../../features/shop/context/CartContext'
import CartDrawer from '../../features/shop/components/CartDrawer'

// 🆕 LANGUAGE SWITCHER - Import component
import LanguageSwitcher from '../../i18n/components/LanguageSwitcher'

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
  const [unreadEmails, setUnreadEmails] = useState(0)
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false)
  const closeTimeoutRef = useRef(null)
  const buttonRefs = useRef({})
  const currentDropdownRef = useRef(null)
  const themeDropdownRef = useRef(null)
  
  const { i18n, t } = useTranslation('common')
  const { darkMode, toggleDarkMode, currentTheme, themes, setTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // 🆕 SHOP - Cart & Drawer state
  const { cartCount } = useCart()
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)

  // 🔌 WebSocket connection
  const { isConnected, lastMessage } = useWebSocket()

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
    if (!isAuthenticated) {
      setTotalUnreadNotifications(0)
      setTotalUnreadMessages(0)
      setUnreadEmails(0)
      return
    }

    const fetchCounts = async () => {
      try {
        const [n, m, e] = await Promise.all([
          api.get('/notification-counts/unread/').catch(() => ({ data: { unread_count: 0 } })),
          api.get('/realtime/unread-count/').catch(() => ({ data: { unread_count: 0 } })),
          api.get('/email-inbox/mailboxes/').catch(() => ({ data: { unread: 0 } }))
        ])
        setTotalUnreadNotifications(n.data?.unread_count || 0)
        setTotalUnreadMessages(m.data?.unread_count || 0)
        setUnreadEmails(e.data?.unread || 0)
      } catch (e) {
        console.error('Error fetching unread counts:', e)
      }
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 300000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // WebSocket updates
  useEffect(() => {
    if (lastMessage && isAuthenticated) {
      const refreshCounts = async () => {
        try {
          const [n, m, mail] = await Promise.all([
            api.get('/notification-counts/unread/').catch(() => ({ data: { unread_count: 0 } })),
            api.get('/realtime/unread-count/').catch(() => ({ data: { unread_count: 0 } })),
            api.get('/email-inbox/mailboxes/').catch(() => ({ data: { unread: 0 } }))
          ])
          setTotalUnreadNotifications(n.data?.unread_count || 0)
          setTotalUnreadMessages(m.data?.unread_count || 0)
          setUnreadEmails(mail.data?.unread || 0)
        } catch (e) { /* silent */ }
      }
      refreshCounts()
    }
  }, [lastMessage, isAuthenticated])

  // Scroll
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Close on route change
  useEffect(() => { setIsOpen(false); setOpenDropdown(null); setIsCartDrawerOpen(false) }, [location])

  useEffect(() => () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current) }, [])

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleLogout = () => { logout(); navigate('/'); setOpenDropdown(null); setActiveModal(null) }

  const openCartDrawer = () => { setIsCartDrawerOpen(true) }

  // ✅ Theme options - 3 themes (White, Brand, Dark) - ZINATAFSIRIWA
  const themeOptions = [
    { id: 'white', label: t('nav.white'), icon: '☀️', color: '#ffffff' },
    { id: 'brand', label: t('nav.brand'), icon: '🌿', color: '#0d5c3e' },
    { id: 'dark', label: t('nav.dark'), icon: '🌙', color: '#0d3320' },
  ]

  // ✅ Menus - ZINATAFSIRIWA (STATIC MENUS)
  const companyMenu = [
    { path: '/about', label: t('nav.about') },
    { path: '/team', label: t('nav.team') },
    { path: '/careers', label: t('nav.careers') },
    { divider: true },
    { path: '/partners', label: t('nav.partners') },
    { path: '/reviews', label: t('nav.reviews') },
    { divider: true },
    { href: '/documents/feevert-company-profile.pdf', label: `📄 ${t('nav.company_profile')}` },
  ]

  // Projects now render as a mega-menu (ProjectsMegaMenu / MobileProjectsMenu),
  // driven by projectCategories + a live /projects fetch - no flat list here.

  // ✅ Resources Menu - ZINATAFSIRIWA
  const resourcesMenu = [
    { path: '/news', label: t('nav.news') },
    { path: '/faq', label: t('nav.faq') },
    { divider: true },
    { path: '/contact', label: t('nav.contact') },
  ]

  // ✅ Shop Menu - ZINATAFSIRIWA
  const shopMenu = [
    { path: '/shop', label: t('nav.all_products'), icon: '🛒' },
    { path: '/shop?type=honey', label: `🍯 ${t('nav.honey')}`, icon: '🍯' },
    { path: '/shop?type=beeswax', label: `🕯️ ${t('nav.beeswax')}`, icon: '🕯️' },
    { path: '/shop?type=equipment', label: `🛠️ ${t('nav.equipment')}`, icon: '🛠️' },
    { path: '/shop?type=books', label: `📚 ${t('nav.books')}`, icon: '📚' },
    { divider: true },
    { path: '/shop/cart', label: `🛍️ ${t('nav.cart')}`, icon: '🛍️', badge: cartCount > 0 ? cartCount : null },
    { path: '/shop/orders', label: `📦 ${t('nav.my_orders')}`, icon: '📦' },
  ]

  // ✅ User Menu - ZINATAFSIRIWA
  const roleName = (user?.role_name || user?.role || '').toLowerCase()
  const isStaffRole = ['admin', 'consultant', 'normal employee'].includes(roleName)

  const userMenuItems = isAuthenticated ? [
    { label: user?.full_name || user?.username || 'User', type: 'header', email: user?.email },
    { divider: true },
    { path: '/profile', label: t('auth.profile'), icon: '👤' },
    { path: '/dashboard', label: t('auth.dashboard'), icon: '📊' },
    { divider: true },
    { path: '/my-bookings', label: t('auth.my_bookings'), icon: '📅' },
    { path: '/consultations', label: t('auth.my_consultations'), icon: '💬' },
    { path: '/payment-history', label: t('auth.payment_history'), icon: '💳' },
    { path: '/shop/orders', label: t('nav.my_orders'), icon: '📦' },
    { path: '/notifications', label: t('auth.notifications'), icon: '🔔', badge: totalUnreadNotifications },
    { action: 'chat', label: t('auth.messages'), icon: '💭', badge: totalUnreadMessages, onClick: () => { setActiveModal('chat'); setOpenDropdown(null) } },
    { action: 'support', label: t('auth.support'), icon: '🛟', onClick: () => { setActiveModal('support'); setOpenDropdown(null) } },
    ...(isStaffRole ? [{ path: '/workspace', label: t('auth.workspace') || 'My Workspace', icon: '🧰' }, { path: '/email-inbox', label: t('auth.email_inbox') || 'Email Inbox', icon: '📧', badge: unreadEmails }] : []),
    { divider: true },
    { path: '/settings', label: t('auth.settings'), icon: '⚙️' },
    { action: 'logout', label: t('auth.sign_out'), icon: '🚪', danger: true },
  ] : [
    { path: '/login', label: t('auth.sign_in'), icon: '🔐' },
    { path: '/register', label: t('auth.sign_up'), icon: '📝' },
  ]

  const getDropdownItems = (name) => {
    switch(name) {
      case 'company': return companyMenu
      case 'resources': return resourcesMenu
      case 'shop': return shopMenu
      default: return []
    }
  }

  const totalBadge = totalUnreadNotifications + totalUnreadMessages + unreadEmails

  return (
    <>
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'glass-nav scrolled shadow-sm' : 'glass-nav'}`}
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0 mr-2">
              {!imgError ? (
                <img src="/logo-2520.png" alt="FeeVert" className="h-8 md:h-10 w-auto object-contain" onError={() => setImgError(true)} />
              ) : <span className="text-xl font-bold gradient-text">FeeVert</span>}
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex flex-1 mx-2 justify-center">
              <nav className="flex items-center gap-1">
                <Link to="/home" className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${location.pathname === '/home' ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)]' : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'}`}>
                  {t('nav.home')}
                </Link>
                <DropdownButton name="company" label={t('nav.company')} onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="services" label={t('nav.services')} onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="projects" label={t('nav.projects')} onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <DropdownButton name="resources" label={t('nav.resources')} onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
                <Link to="/shop" className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 ${location.pathname.startsWith('/shop') ? 'text-emerald-400 bg-emerald-500/15' : 'text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                  🛒 {t('nav.shop')}
                  {cartCount > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </Link>
              </nav>
            </div>
            
            {/* ============ RIGHT ACTIONS ============ */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* 🆕 THEME SWITCHER - FIXED DROPDOWN (Inaonekana chini) */}
              <div className="relative" ref={themeDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsThemeDropdownOpen(!isThemeDropdownOpen)
                  }}
                  className="btn-icon btn-circle btn-sm relative hover:bg-[var(--g-liquid-secondary)] transition-all duration-300"
                  aria-label={t('nav.theme')}
                >
                  <span className="text-lg">
                    {currentTheme === 'white' ? '☀️' : currentTheme === 'brand' ? '🌿' : '🌙'}
                  </span>
                </button>

                {/* Theme Dropdown - Inaonekana CHINI ya button */}
                <AnimatePresence>
                  {isThemeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-48 w-48 glass-card p-2 shadow-2xl shadow-black/30 border border-[var(--g-border)]"
                      style={{
                        top: '100%',
                        backdropFilter: 'blur(24px) saturate(1.4)',
                        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                        background: 'var(--g-background)',
                        zIndex: 99999,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {themeOptions.map((option) => {
                        const isActive = currentTheme === option.id
                        const isDark = option.id === 'dark' || option.id === 'brand'
                        
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              setTheme(option.id)
                              setIsThemeDropdownOpen(false)
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
                            <span className="text-base">{option.icon}</span>
                            <span className="flex-1">{option.label}</span>
                            <div 
                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                isActive ? 'border-emerald-400' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: option.color }}
                            />
                            {isActive && (
                              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 🆕 SHOP - Cart Icon */}
              <button onClick={openCartDrawer} className="btn-icon btn-circle btn-sm relative" aria-label={t('nav.cart')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
              
              {/* 🆕 LANGUAGE SWITCHER */}
              <LanguageSwitcher />
              
              {/* User Dropdown */}
              <DropdownButton name="user" label={
                <span className="flex items-center gap-1 relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {isAuthenticated && totalBadge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5">
                      {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                  )}
                  <span className="hidden lg:inline text-sm ml-1">
                    {isAuthenticated ? (user?.username || t('auth.account')) : t('auth.sign_in')}
                  </span>
                </span>
              } onEnter={handleDropdownEnter} onLeave={handleDropdownLeave} buttonRefs={buttonRefs} open={openDropdown} />
              
              {/* Mobile Menu Toggle */}
              <button onClick={() => setIsOpen(!isOpen)} className="btn-icon md:hidden" aria-label="Toggle menu">
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
        
        {/* ============ MOBILE MENU ============ */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden mx-4 rounded-b-2xl mobile-menu-container"
              style={{
                background: 'var(--g-background)',
                backdropFilter: 'blur(20px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
                border: '1px solid var(--g-border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="px-4 py-4 space-y-1 max-h-[75vh] overflow-y-auto">
                {/* Mobile Menu Items */}
                <Link to="/home" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>
                  {t('nav.home')}
                </Link>
                <MobileDropdown label={t('nav.company')} items={companyMenu} onClose={() => setIsOpen(false)} />
                <MobileServicesMenu categories={serviceCategories} tree={servicesTree} onClose={() => setIsOpen(false)} />
                <MobileProjectsMenu categories={projectCategories} onClose={() => setIsOpen(false)} />
                <MobileDropdown label={t('nav.resources')} items={resourcesMenu} onClose={() => setIsOpen(false)} />
                
                <div className="divider-glass my-3" />
                <p className="px-4 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">{t('nav.shop')}</p>
                <Link to="/shop" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsOpen(false)}>
                  🛒 {t('nav.all_products')}
                </Link>
                <Link to="/shop?type=honey" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsOpen(false)}>
                  🍯 {t('nav.honey')}
                </Link>
                <Link to="/shop?type=beeswax" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsOpen(false)}>
                  🕯️ {t('nav.beeswax')}
                </Link>
                <Link to="/shop?type=equipment" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsOpen(false)}>
                  🛠️ {t('nav.equipment')}
                </Link>
                <button onClick={() => { setIsOpen(false); setIsCartDrawerOpen(true) }} className="w-full text-left px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-between">
                  <span>🛍️ {t('nav.cart')}</span>
                  {cartCount > 0 && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>}
                </button>
                <Link to="/shop/cart" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsOpen(false)}>
                  📋 {t('nav.view_full_cart')}
                </Link>
                {isAuthenticated && (
                  <Link to="/shop/orders" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsOpen(false)}>
                    📦 {t('nav.my_orders')}
                  </Link>
                )}
                
                {/* 🆕 THEME OPTIONS IN MOBILE MENU */}
                <div className="divider-glass my-3" />
                <p className="px-4 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">{t('nav.theme')}</p>
                <div className="grid grid-cols-3 gap-2 px-4 py-2">
                  {themeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => { setTheme(option.id); setIsOpen(false) }}
                      className={`p-2 rounded-xl text-center transition-all duration-200 ${
                        currentTheme === option.id
                          ? 'glass-card border-emerald-400/50'
                          : 'glass hover:border-white/20'
                      }`}
                    >
                      <div className="text-lg">{option.icon}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{option.label}</div>
                    </button>
                  ))}
                </div>
                
                <div className="divider-glass my-3" />
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-sm font-semibold text-[var(--g-text-primary)]">{user?.full_name || user?.username}</div>
                    <div className="px-4 py-1 text-xs text-[var(--g-text-tertiary)] mb-2">{user?.email}</div>
                    {[
                      { path: '/profile', label: t('auth.profile'), icon: '👤' },
                      { path: '/dashboard', label: t('auth.dashboard'), icon: '📊' },
                      { path: '/my-bookings', label: t('auth.my_bookings'), icon: '📅' },
                      { path: '/consultations', label: t('auth.my_consultations'), icon: '💬' },
                      { path: '/payment-history', label: t('auth.payment_history'), icon: '💳' }
                    ].map((item) => (
                      <Link key={item.path} to={item.path} className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>
                        {item.icon} {item.label}
                      </Link>
                    ))}
                    <Link to="/notifications" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]" onClick={() => setIsOpen(false)}>
                      🔔 {t('auth.notifications')} {totalUnreadNotifications > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadNotifications}</span>}
                    </Link>
                    <button onClick={() => { setActiveModal('chat'); setIsOpen(false) }} className="w-full text-left px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] flex items-center gap-3">
                      💭 {t('auth.messages')} {totalUnreadMessages > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{totalUnreadMessages}</span>}
                    </button>
                    <button onClick={() => { setActiveModal('support'); setIsOpen(false) }} className="w-full text-left px-4 py-3 rounded-xl text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] flex items-center gap-3">
                      🛟 {t('auth.support')}
                    </button>
                    <Link to="/settings" className="block px-4 py-3 rounded-xl text-[var(--g-text-secondary)]" onClick={() => setIsOpen(false)}>
                      ⚙️ {t('auth.settings')}
                    </Link>
                    <button onClick={() => { handleLogout(); setIsOpen(false) }} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl mt-2 font-medium">
                      🚪 {t('auth.sign_out')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block w-full text-center px-4 py-3 mb-2 btn-primary rounded-xl" onClick={() => setIsOpen(false)}>
                      {t('auth.sign_in')}
                    </Link>
                    <Link to="/register" className="block w-full text-center px-4 py-3 btn-outline rounded-xl" onClick={() => setIsOpen(false)}>
                      {t('auth.sign_up')}
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
      
      {/* Dropdown Portals */}
      {openDropdown === 'services' && createPortal(<ServicesMegaMenu tree={servicesTree} categories={serviceCategories} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      {openDropdown === 'projects' && createPortal(<ProjectsMegaMenu categories={projectCategories} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      {openDropdown && openDropdown !== 'user' && openDropdown !== 'services' && openDropdown !== 'projects' && createPortal(<DropdownContent items={getDropdownItems(openDropdown)} position={dropdownPosition} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      {openDropdown === 'user' && createPortal(<UserDropdownMenu items={userMenuItems} position={dropdownPosition} onClose={() => { setOpenDropdown(null); currentDropdownRef.current = null }} onLogout={handleLogout} navigate={navigate} onMouseEnter={megaEnter} onMouseLeave={megaLeave} />, document.body)}
      
      {/* Chat/Support Modals — a backdrop so tapping outside closes the window
          (previously the only way out was signing out) */}
      {/* The windows centre themselves (position: fixed, z-60), so the wrapper
          here is only a backdrop. `chat-modal` was a class with no CSS behind
          it, which left desktop placement to whatever the navbar happened to
          do. */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50"
             onClick={() => setActiveModal(null)} aria-hidden="true" />
      )}
      {activeModal === 'chat' && (
        <UserChatList isModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'support' && (
        <ChatBox recipientId={1} recipientName="FeeVert Support" onClose={() => setActiveModal(null)} />
      )}
    </>
  )
}

export default Navbar