// src/components/layout/navbar/MobileProjectsMenu.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { categoryIcon } from '../../utils/iconMap'
import api from '../../../app/api'

// Every active category is listed, in the order the database gives them.

// Mobile (hamburger) version of the Projects mega-menu: category → then a
// Completed / On-going split, each project linking to its detail page.
const MobileProjectsMenu = ({ categories, onClose }) => {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCat, setExpandedCat] = useState(null)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!isOpen || projects.length > 0) return
    api.get('/projects/', { params: { page_size: 100 } })
      .then(res => setProjects(res.data?.results || res.data || []))
      .catch(() => {})
  }, [isOpen, projects.length])

  // Categories appear in the order set in the database (the API already returns
  // them sorted by their `order`, then name), so the menu follows the admin panel.
  const coreCategories = useMemo(() => [...(categories || [])], [categories])

  const renderGroup = (catId, workStatus, label) => {
    const items = projects.filter(p => p.category === catId && p.work_status === workStatus)
    if (items.length === 0) return null
    return (
      <div className="mt-1">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--g-text-tertiary)]">{label}</div>
        {items.map(p => (
          <Link key={p.id} to={`/projects/${p.id}`} onClick={onClose}
            className="block px-3 py-2 text-xs text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] rounded-lg line-clamp-1">
            {p.title}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)]"
      >
        {t('projects_menu.projects', 'Projects')}
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
            {coreCategories.map(cat => (
              <div key={cat.id}>
                <button
                  onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-[var(--g-text-secondary)] hover:text-[var(--g-color-primary)] hover:bg-[var(--g-liquid-secondary)] rounded-lg"
                >
                  <span>{categoryIcon(cat)} {cat.name}</span>
                  <motion.span className="text-[10px]" animate={{ rotate: expandedCat === cat.id ? 180 : 0 }}>▼</motion.span>
                </button>

                {expandedCat === cat.id && (
                  <div className="ml-4 pl-3 border-l border-[var(--g-border-glass)]">
                    {renderGroup(cat.id, 'completed', t('projects_menu.completed', 'Completed'))}
                    {renderGroup(cat.id, 'ongoing', t('projects_menu.ongoing', 'On-going'))}
                    {projects.filter(p => p.category === cat.id).length === 0 && (
                      <div className="px-3 py-3 text-xs text-[var(--g-text-tertiary)]">{t('projects_menu.no_projects', 'No projects yet')}</div>
                    )}
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

export default MobileProjectsMenu
