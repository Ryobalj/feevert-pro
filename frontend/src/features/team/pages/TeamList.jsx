import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../app/api'

const TeamList = () => {
  const [team, setTeam] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('all')
  const [loading, setLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamRes, deptsRes] = await Promise.all([
          api.get('/team-members/'),
          api.get('/departments/')
        ])
        
        setTeam(teamRes.data?.results || teamRes.data || [])
        setDepartments(deptsRes.data?.results || deptsRes.data || [])
      } catch (error) {
        console.error('Error loading team:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredTeam = selectedDept === 'all' 
    ? team 
    : team.filter(m => m.department === parseInt(selectedDept))

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-16 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="container-main">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Meet Our <span className="gradient-text">Team</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Passionate professionals dedicated to your success
          </p>
        </motion.div>

        {/* Department Filters */}
        {departments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedDept === 'all'
                  ? 'bg-green-600 text-white'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Team
            </button>
            {departments.map(dept => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedDept === dept.id
                    ? 'bg-green-600 text-white'
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Team Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          {filteredTeam.map((member) => (
            <motion.div key={member.id} variants={cardVariants}>
              <Link to={`/team/${member.id}`}>
                <div className={`modern-card p-5 text-center h-full group cursor-pointer ${
                  darkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-white/80 hover:bg-white'
                }`}>
                  {/* Avatar */}
                  <div className="relative mb-4">
                    {member.profile_picture ? (
                      <img 
                        src={member.profile_picture} 
                        alt={member.full_name}
                        className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full object-cover border-2 border-green-200 dark:border-green-800 group-hover:border-green-400 transition-colors"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center ${
                        member.profile_picture ? 'hidden' : 'flex'
                      }`}
                    >
                      <span className="text-3xl font-bold text-white">
                        {member.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className={`font-semibold text-lg mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {member.full_name}
                  </h3>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
                    {member.role || member.position}
                  </p>
                  {member.department_name && (
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {member.department_name}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredTeam.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              No team members found in this department.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default TeamList
