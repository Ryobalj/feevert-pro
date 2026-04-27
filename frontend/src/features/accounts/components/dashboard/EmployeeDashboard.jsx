// src/features/accounts/components/dashboard/EmployeeDashboard.jsx

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-white/50 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 md:py-12"
    >
      <div className="container-main">
        {/* ============ WELCOME HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white">
                Employee <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="mt-2 text-white/40 text-sm">
                Welcome, {user?.full_name || user?.username}
              </p>
            </div>
            {/* Quick stats badge */}
            <div className="glass px-4 py-2 rounded-full text-sm text-white/50">
              <span className="text-emerald-400 font-semibold">{projects.length}</span> projects •{' '}
              <span className="text-amber-400 font-semibold">{news.length}</span> news •{' '}
              <span className="text-purple-400 font-semibold">{team.length}</span> teammates
            </div>
          </div>
        </motion.div>

        {/* ============ PROJECTS ============ */}
        <DashboardSection title="Projects" icon="📁" link="/projects" delay={0.1}>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map(project => (
                <ProjectCard key={project.id} project={project} darkMode={darkMode} />
              ))}
            </div>
          ) : (
            <EmptyMessage message="No projects assigned yet" />
          )}
        </DashboardSection>

        {/* ============ LATEST NEWS ============ */}
        <DashboardSection title="Latest News" icon="📰" link="/news" delay={0.15}>
          {news.length > 0 ? (
            <div className="space-y-3">
              {news.slice(0, 3).map(item => (
                <NewsItem key={item.id} news={item} darkMode={darkMode} />
              ))}
            </div>
          ) : (
            <EmptyMessage message="No news articles yet" />
          )}
        </DashboardSection>

        {/* ============ TEAM MEMBERS ============ */}
        <DashboardSection title="Team Members" icon="👥" link="/team" delay={0.2}>
          {team.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {team.slice(0, 4).map(member => (
                <TeamMemberCard key={member.id} member={member} darkMode={darkMode} />
              ))}
            </div>
          ) : (
            <EmptyMessage message="No team members yet" />
          )}
        </DashboardSection>
      </div>
    </motion.div>
  )
}

// ============ DASHBOARD SECTION ============
const DashboardSection = ({ title, icon, link, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 mb-6 group hover:border-emerald-400/20 transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">{icon}</span>
        {title}
      </h2>
      <Link to={link} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1 group/link">
        View all
        <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
    {children}
  </motion.div>
)

// ============ EMPTY MESSAGE ============
const EmptyMessage = ({ message }) => (
  <div className="text-center py-8">
    <p className="text-white/30 text-sm">{message}</p>
  </div>
)

export default EmployeeDashboard