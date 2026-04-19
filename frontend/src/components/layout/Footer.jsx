import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-6">
      <div className="container-main">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} FeeVert Solution Limited. All rights reserved.
          </div>
          
          <nav className="flex gap-6 text-sm">
            <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400">About</Link>
            <Link to="/services" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400">Services</Link>
            <Link to="/projects" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400">Projects</Link>
            <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
