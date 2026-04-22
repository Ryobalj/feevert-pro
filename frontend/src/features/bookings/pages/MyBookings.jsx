// src/features/bookings/pages/MyBookings.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useBookings } from '../hooks'
import { BookingCard, BookingFilters, EmptyBookingState } from '../components'

const MyBookings = () => {
  const { darkMode } = useTheme()
  const { bookings, loading, filter, setFilter } = useBookings()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="spinner"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-12 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main max-w-4xl">
        <PageHeader darkMode={darkMode} />
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <BookingFilters currentFilter={filter} onFilterChange={setFilter} darkMode={darkMode} />
        </motion.div>

        {bookings.length > 0 ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 mt-6">
            {bookings.map((booking) => (
              <motion.div key={booking.id} variants={cardVariants}>
                <BookingCard booking={booking} darkMode={darkMode} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyBookingState filter={filter} darkMode={darkMode} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const PageHeader = ({ darkMode }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
      <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        My <span className="gradient-text">Bookings</span>
      </h1>
      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your appointments</p>
    </motion.div>
    
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Link to="/book-appointment">
        <button className="glow-button px-5 py-2.5">New Booking</button>
      </Link>
    </motion.div>
  </div>
)

export default MyBookings