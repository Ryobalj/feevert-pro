// src/features/accounts/components/dashboard/EmployeeDashboard.jsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../app/api'
import { ProjectCard, NewsItem, TeamMemberCard } from './index'

const EmployeeDashboard = ({ user, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [news, setNews] = useState([])
  const [team, setTeam] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, newsRes, teamRes] = await Promise.all([
          api.get('/projects/').catch(() => ({ data: { results: [] } })),
          api.get('/news/').catch(() => ({ data: { results: [] } })),
          api.get('/team-members/').catch(() => ({ data: { results: [] } }))
        ])
        
        setProjects(projectsRes.data?.results || projectsRes.data || [])
        setNews(newsRes.data?.results || newsRes.data || [])
        setTeam(teamRes.data?.results || teamRes.data || [])
      } catch (error) {
        console.error('Error loading employee dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen py-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <div className="container-main">
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Employee Dashboard
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome, {user?.full_name || user?.username}
          </p>
        </div>

        <div className={`modern-card p-6 mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map(project => (
              <ProjectCard key={project.id} project={project} darkMode={darkMode} />
            ))}
          </div>
        </div>

        <div className={`modern-card p-6 mb-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Latest News</h2>
          <div className="space-y-3">
            {news.slice(0, 3).map(item => (
              <NewsItem key={item.id} news={item} darkMode={darkMode} />
            ))}
          </div>
        </div>

        <div className={`modern-card p-6 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Team Members</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {team.slice(0, 4).map(member => (
              <TeamMemberCard key={member.id} member={member} darkMode={darkMode} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EmployeeDashboard