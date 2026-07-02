// frontend/src/components/layout/Footer.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Footer = () => {
  const { t } = useTranslation('common')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="liquid-glass border-t border-[var(--g-border-glass)] mt-auto">
      <div className="container-main py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm text-[var(--g-text-tertiary)]">
            © {currentYear} {t('footer.rights')}
          </div>

          {/* Footer Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
            <Link 
              to="/about" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('nav.about')}
            </Link>
            <Link 
              to="/services" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('nav.services')}
            </Link>
            <Link 
              to="/projects" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('nav.projects')}
            </Link>
            <Link 
              to="/team" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('nav.team')}
            </Link>
            <Link 
              to="/contact" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('nav.contact')}
            </Link>
            <span className="text-[var(--g-text-tertiary)]/30 hidden md:inline">|</span>
            <Link 
              to="/privacy-policy" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('footer.privacy_policy')}
            </Link>
            <Link 
              to="/terms" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              {t('footer.terms_of_service')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer