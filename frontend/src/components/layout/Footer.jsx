import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="liquid-glass border-t border-[var(--g-border-glass)] mt-auto">
      <div className="container-main py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm text-[var(--g-text-tertiary)]">
            © {currentYear} <span className="text-[var(--g-color-primary)] font-semibold">FeeVert</span> Solution Limited. All rights reserved.
          </div>
          
          {/* Footer Navigation */}
          <nav className="flex gap-6 text-sm">
            <Link 
              to="/about" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              About
            </Link>
            <Link 
              to="/services" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              Services
            </Link>
            <Link 
              to="/projects" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              Projects
            </Link>
            <Link 
              to="/contact" 
              className="text-[var(--g-text-tertiary)] hover:text-[var(--g-color-primary)] transition-colors duration-200"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
