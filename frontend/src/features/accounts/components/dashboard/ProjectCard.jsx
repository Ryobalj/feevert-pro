import React from 'react'
import { Link } from 'react-router-dom'

const ProjectCard = ({ project, darkMode }) => (
  <Link to={`/projects/${project.id}`} className={`block p-4 rounded-lg transition-colors ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
    <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{project.title}</h3>
    <p className={`text-xs line-clamp-2 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{project.description}</p>
    <span className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{project.category_name || 'Project'}</span>
  </Link>
)

export default ProjectCard
