// src/components/layout/navbar/ServicesMegaMenu.jsx

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getIcon } from './IconMap'

const ServicesMegaMenu = ({ tree, categories, onClose, onMouseEnter, onMouseLeave }) => {
  const [activeMainId, setActiveMainId] = useState(null)
  const [activeSubId, setActiveSubId] = useState(null)
  const [mobileTab, setMobileTab] = useState('categories')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const mainCategories = React.useMemo(() => {
    if (tree.length > 0) return tree
    return categories.filter(c => c.level === 0 && c.is_active)
  }, [tree, categories])

  const activeMain = React.useMemo(() => mainCategories.find(c => c.id === activeMainId), [mainCategories, activeMainId])
  const subCategories = activeMain?.children || []
  const activeSub = subCategories.find(c => c.id === activeSubId)
  const services = activeSub?.services || activeMain?.services || []

  useEffect(() => {
    if (mainCategories.length > 0 && !activeMainId) setActiveMainId(mainCategories[0].id)
  }, [mainCategories, activeMainId])

  const handleMainSelect = (catId) => {
    setActiveMainId(catId)
    setActiveSubId(null)
    if (isMobile) setMobileTab('subs')
  }

  const handleSubSelect = (subId) => {
    setActiveSubId(subId)
    if (isMobile) setMobileTab('services')
  }

  if (!mainCategories?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="fixed card-glass !p-0 shadow-2xl overflow-hidden dropdown-menu-container z-[9999] rounded-2xl border border-[var(--g-border-glass)]"
      style={{
        top: '68px', left: '50%', transform: 'translateX(-50%)',
        width: isMobile ? '92vw' : 'min(96vw, 880px)',
        maxHeight: isMobile ? '80vh' : 'min(85vh, 520px)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--g-border-glass)] bg-[var(--g-surface-glass)]/30">
        <h3 className="text-xs font-semibold text-[var(--g-text-tertiary)] uppercase tracking-widest">🛠️ Services Menu</h3>
        <Link to="/services" onClick={onClose} className="text-xs text-[var(--g-color-primary)] hover:underline font-medium">View All →</Link>
      </div>

      {/* Mobile: Tabs */}
      {isMobile ? (
        <>
          <div className="flex border-b border-[var(--g-border-glass)]">
            {['categories', 'subs', 'services'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'subs' && !activeMainId) return
                  if (tab === 'services' && !activeSubId) return
                  setMobileTab(tab)
                }}
                disabled={(tab === 'subs' && !activeMainId) || (tab === 'services' && !activeSubId)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  i < 2 ? 'border-r border-[var(--g-border-glass)]' : ''
                } ${
                  mobileTab === tab
                    ? 'text-[var(--g-color-primary)] border-b-2 border-[var(--g-color-primary)] bg-[var(--g-liquid-primary)]'
                    : 'text-[var(--g-text-tertiary)] hover:text-[var(--g-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {{ categories: 'Categories', subs: 'Sub-Categories', services: 'Services' }[tab]}
              </button>
            ))}
          </div>

          {/* ✅ Mobile: Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
            {mobileTab === 'categories' && (
              <div className="p-2 space-y-0.5">
                {mainCategories.map(cat => (
                  <button key={cat.id} onClick={() => handleMainSelect(cat.id)}
                    className={`w-full text-left px-3 py-3 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      activeMainId === cat.id ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)] font-semibold' : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                    }`}>
                    <span className="text-lg">{getIcon(cat.icon)}</span>
                    <span>{cat.name}</span>
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            )}

            {mobileTab === 'subs' && (
              <div className="p-2 space-y-0.5">
                <button onClick={() => setMobileTab('categories')} className="w-full text-left px-3 py-2 text-xs text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] flex items-center gap-1 mb-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back to Categories
                </button>
                <h4 className="px-3 py-1 text-xs font-semibold text-[var(--g-text-secondary)]">{getIcon(activeMain?.icon)} {activeMain?.name}</h4>
                {subCategories.length > 0 ? subCategories.map(sub => (
                  <button key={sub.id} onClick={() => handleSubSelect(sub.id)}
                    className={`w-full text-left px-3 py-3 text-sm rounded-lg transition-all duration-200 flex items-center justify-between ${
                      activeSubId === sub.id ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)] font-semibold' : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                    }`}>
                    {sub.name}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )) : <div className="px-3 py-6 text-center text-xs text-[var(--g-text-tertiary)]">No sub-categories</div>}
              </div>
            )}

            {mobileTab === 'services' && (
              <div className="p-2 space-y-0.5">
                <button onClick={() => setMobileTab('subs')} className="w-full text-left px-3 py-2 text-xs text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] flex items-center gap-1 mb-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back to {activeMain?.name || 'Sub-Categories'}
                </button>
                <h4 className="px-3 py-1 text-xs font-semibold text-[var(--g-text-secondary)]">{activeSub?.name || 'Services'}</h4>
                {services.length > 0 ? services.map(service => (
                  <Link key={service.id} to={`/services/${service.id}`} onClick={onClose}
                    className="block px-3 py-3 text-sm rounded-lg transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]">
                    <div className="font-medium flex items-center gap-2"><span className="text-lg">{getIcon(service.icon)}</span><span>{service.name}</span></div>
                    {service.display_price && service.display_price !== 'Get Quote' && <div className="text-[10px] text-[var(--g-text-tertiary)] mt-0.5 ml-7">{service.display_price}</div>}
                  </Link>
                )) : <div className="px-3 py-6 text-center text-xs text-[var(--g-text-tertiary)]">No services</div>}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ✅ Desktop: 3 Columns - ALL SCROLLABLE */
        <div className="overflow-x-auto overflow-y-hidden" style={{ height: 'min(65vh, 400px)' }}>
          <div className="flex divide-x divide-[var(--g-border-glass)] min-w-max">
            {/* Column 1: Categories */}
            <div className="w-[220px] flex-shrink-0 overflow-y-auto scrollbar-thin p-2">
              <h4 className="px-3 py-1.5 text-[10px] font-semibold text-[var(--g-text-tertiary)] uppercase tracking-wider sticky top-0 bg-[var(--g-surface-glass)]/80 backdrop-blur-sm z-10">
                Categories
              </h4>
              <div className="space-y-0.5">
                {mainCategories.map(cat => (
                  <button
                    key={cat.id}
                    onMouseEnter={() => { setActiveMainId(cat.id); setActiveSubId(null) }}
                    onClick={() => handleMainSelect(cat.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      activeMainId === cat.id
                        ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)] font-semibold'
                        : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{getIcon(cat.icon)}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Sub-Categories */}
            <div className="w-[240px] flex-shrink-0 overflow-y-auto scrollbar-thin p-2">
              <h4 className="px-3 py-1.5 text-[10px] font-semibold text-[var(--g-text-tertiary)] uppercase tracking-wider sticky top-0 bg-[var(--g-surface-glass)]/80 backdrop-blur-sm z-10">
                {activeMain?.name || 'Sub-Categories'}
              </h4>
              {activeMainId ? (
                subCategories.length > 0 ? (
                  <div className="space-y-0.5">
                    {subCategories.map(sub => (
                      <button
                        key={sub.id}
                        onMouseEnter={() => setActiveSubId(sub.id)}
                        onClick={() => handleSubSelect(sub.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          activeSubId === sub.id
                            ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)] font-semibold'
                            : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center text-xs text-[var(--g-text-tertiary)]">No sub-categories</div>
                )
              ) : (
                <div className="px-3 py-8 text-center text-xs text-[var(--g-text-tertiary)]">👈 Select a category</div>
              )}
            </div>

            {/* Column 3: Services */}
            <div className="w-[280px] flex-shrink-0 overflow-y-auto scrollbar-thin p-2">
              <h4 className="px-3 py-1.5 text-[10px] font-semibold text-[var(--g-text-tertiary)] uppercase tracking-wider sticky top-0 bg-[var(--g-surface-glass)]/80 backdrop-blur-sm z-10">
                {activeSub?.name || 'Services'}
              </h4>
              {activeSubId || (activeMainId && subCategories.length === 0) ? (
                services.length > 0 ? (
                  <div className="space-y-0.5">
                    {services.map(service => (
                      <Link
                        key={service.id}
                        to={`/services/${service.id}`}
                        onClick={onClose}
                        className="block px-3 py-2 text-sm rounded-lg transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]"
                      >
                        <div className="font-medium flex items-center gap-2">
                          <span className="text-base">{getIcon(service.icon)}</span>
                          <span>{service.name}</span>
                        </div>
                        {service.display_price && service.display_price !== 'Get Quote' && (
                          <div className="text-[10px] text-[var(--g-text-tertiary)] mt-0.5 ml-7">{service.display_price}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center text-xs text-[var(--g-text-tertiary)]">No services</div>
                )
              ) : (
                <div className="px-3 py-8 text-center text-xs text-[var(--g-text-tertiary)]">👈 Select a sub-category</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="border-t border-[var(--g-border-glass)] p-3 bg-[var(--g-surface-glass)]/30">
        <Link to="/request-consultation" onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[var(--g-color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-all duration-300 shadow-sm">
          📋 Request Consultation
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
      </div>
    </motion.div>
  )
}

export default ServicesMegaMenu