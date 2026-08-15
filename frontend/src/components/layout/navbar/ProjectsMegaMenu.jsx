// src/components/layout/navbar/ProjectsMegaMenu.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../../ui/Icon'
import { iconForName } from '../../utils/iconMap'
import api from '../../../app/api'

// The Projects menu mirrors the Services mega-menu, but its three columns are:
//   1. Category (only the 3 core-service categories)
//   2. Completed projects in that category
//   3. On-going projects in that category
// A project card links straight to its detail page (/projects/:id).
const CORE_SLUGS = ['beekeeping', 'environment', 'ohs']

const ProjectCard = ({ project, onClose }) => (
  <Link
    to={`/projects/${project.id}`}
    onClick={onClose}
    className="flex gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-[var(--g-liquid-secondary)] group/proj"
  >
    {project.cover_image_url && (
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--g-surface-glass)]">
        <img src={project.cover_image_url} alt="" className="w-full h-full object-cover group-hover/proj:scale-105 transition-transform duration-300" loading="lazy" onError={(e) => { e.target.style.display = 'none' }} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="font-medium text-sm text-[var(--g-text-secondary)] group-hover/proj:text-[var(--g-color-primary)] transition-colors line-clamp-2 leading-snug">
        {project.title}
      </div>
      {project.client_name && (
        <div className="text-[10px] text-[var(--g-text-tertiary)] mt-0.5 truncate">{project.client_name}</div>
      )}
    </div>
  </Link>
)

const ProjectsMegaMenu = ({ categories, onClose, onMouseEnter, onMouseLeave }) => {
  const [projects, setProjects] = useState([])
  const [activeCatId, setActiveCatId] = useState(null)
  const [mobileTab, setMobileTab] = useState('categories')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch all published projects once - only 7 exist, so filtering
  // client-side by category + work_status is cheaper than per-hover calls.
  useEffect(() => {
    api.get('/projects/', { params: { page_size: 100 } })
      .then(res => setProjects(res.data?.results || res.data || []))
      .catch(() => {})
  }, [])

  // Only the three core-service categories, in a stable order.
  const coreCategories = useMemo(() => {
    const list = (categories || []).filter(c => CORE_SLUGS.includes((c.slug || '').toLowerCase()))
    return list.sort((a, b) => CORE_SLUGS.indexOf((a.slug || '').toLowerCase()) - CORE_SLUGS.indexOf((b.slug || '').toLowerCase()))
  }, [categories])

  useEffect(() => {
    if (coreCategories.length > 0 && !activeCatId) setActiveCatId(coreCategories[0].id)
  }, [coreCategories, activeCatId])

  const activeCat = coreCategories.find(c => c.id === activeCatId)
  const inCategory = projects.filter(p => p.category === activeCatId)
  const completed = inCategory.filter(p => p.work_status === 'completed')
  const ongoing = inCategory.filter(p => p.work_status === 'ongoing')

  const handleCatSelect = (catId) => {
    setActiveCatId(catId)
    if (isMobile) setMobileTab('completed')
  }

  if (!coreCategories?.length) return null

  const EmptyCol = ({ text }) => (
    <div className="px-3 py-8 text-center text-xs text-[var(--g-text-tertiary)]">{text}</div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="fixed card-glass !p-0 shadow-2xl overflow-hidden dropdown-menu-container z-[9999] rounded-2xl border border-[var(--g-border-glass)]"
      style={{
        top: '68px',
        left: isMobile ? '50%' : '32%',
        transform: isMobile ? 'translateX(-50%)' : 'none',
        width: isMobile ? '92vw' : 'min(96vw, 820px)',
        maxHeight: isMobile ? '80vh' : 'min(85vh, 520px)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--g-border-glass)] bg-[var(--g-surface-glass)]/30">
        <h3 className="text-xs font-semibold text-[var(--g-text-tertiary)] uppercase tracking-widest flex items-center gap-1">
          <Icon name="📁" size="text-sm" /> Projects Menu
        </h3>
      </div>

      {isMobile ? (
        <>
          <div className="flex border-b border-[var(--g-border-glass)]">
            {[['categories', 'Categories'], ['completed', 'Completed'], ['ongoing', 'On-going']].map(([tab, label], i) => (
              <button
                key={tab}
                onClick={() => { if (tab !== 'categories' && !activeCatId) return; setMobileTab(tab) }}
                disabled={tab !== 'categories' && !activeCatId}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all duration-200 ${i < 2 ? 'border-r border-[var(--g-border-glass)]' : ''} ${
                  mobileTab === tab
                    ? 'text-[var(--g-color-primary)] border-b-2 border-[var(--g-color-primary)] bg-[var(--g-liquid-primary)]'
                    : 'text-[var(--g-text-tertiary)] hover:text-[var(--g-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
            {mobileTab === 'categories' && (
              <div className="p-2 space-y-0.5">
                {coreCategories.map(cat => (
                  <button key={cat.id} onClick={() => handleCatSelect(cat.id)}
                    className={`w-full text-left px-3 py-3 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      activeCatId === cat.id ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)] font-semibold' : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                    }`}>
                    <Icon name={cat.icon || iconForName(cat.name)} size="text-lg" className="flex-shrink-0" />
                    <span>{cat.name}</span>
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            )}
            {mobileTab === 'completed' && (
              <div className="p-2">
                <h4 className="px-3 py-1 text-xs font-semibold text-[var(--g-text-secondary)]">{activeCat?.name} — Completed</h4>
                {completed.length > 0 ? completed.map(p => <ProjectCard key={p.id} project={p} onClose={onClose} />) : <EmptyCol text="No completed projects" />}
              </div>
            )}
            {mobileTab === 'ongoing' && (
              <div className="p-2">
                <h4 className="px-3 py-1 text-xs font-semibold text-[var(--g-text-secondary)]">{activeCat?.name} — On-going</h4>
                {ongoing.length > 0 ? ongoing.map(p => <ProjectCard key={p.id} project={p} onClose={onClose} />) : <EmptyCol text="No on-going projects" />}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Desktop: 3 columns */
        <div className="flex divide-x divide-[var(--g-border-glass)]" style={{ height: 'min(58vh, 420px)' }}>
          {/* Column 1: Categories */}
          <div className="w-[220px] flex-shrink-0 overflow-y-auto scrollbar-thin p-2">
            <h4 className="px-3 py-1.5 text-[10px] font-semibold text-[var(--g-text-tertiary)] uppercase tracking-wider sticky top-0 bg-[var(--g-surface-glass)]/80 backdrop-blur-sm z-10 rounded-md mb-1">
              Categories
            </h4>
            <div className="space-y-0.5">
              {coreCategories.map(cat => (
                <button
                  key={cat.id}
                  onMouseEnter={() => setActiveCatId(cat.id)}
                  onClick={() => handleCatSelect(cat.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    activeCatId === cat.id ? 'text-[var(--g-color-primary)] bg-[var(--g-liquid-primary)] font-semibold' : 'text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]'
                  }`}
                >
                  <Icon name={cat.icon || iconForName(cat.name)} size="text-base" className="flex-shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Completed */}
          <div className="flex-1 min-w-[260px] overflow-y-auto scrollbar-thin p-2">
            <h4 className="px-3 py-1.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider sticky top-0 bg-[var(--g-surface-glass)]/80 backdrop-blur-sm z-10 rounded-md mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed Projects
            </h4>
            {activeCatId ? (
              completed.length > 0 ? <div className="space-y-0.5">{completed.map(p => <ProjectCard key={p.id} project={p} onClose={onClose} />)}</div> : <EmptyCol text="No completed projects" />
            ) : <EmptyCol text="👈 Select a category" />}
          </div>

          {/* Column 3: On-going */}
          <div className="flex-1 min-w-[260px] overflow-y-auto scrollbar-thin p-2">
            <h4 className="px-3 py-1.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider sticky top-0 bg-[var(--g-surface-glass)]/80 backdrop-blur-sm z-10 rounded-md mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> On-going Projects
            </h4>
            {activeCatId ? (
              ongoing.length > 0 ? <div className="space-y-0.5">{ongoing.map(p => <ProjectCard key={p.id} project={p} onClose={onClose} />)}</div> : <EmptyCol text="No on-going projects" />
            ) : <EmptyCol text="👈 Select a category" />}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default ProjectsMegaMenu
