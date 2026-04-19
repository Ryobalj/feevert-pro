import React from 'react'
import { Link } from 'react-router-dom'

const ProjectCard = ({ project }) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
      <div className="h-48 bg-gradient-to-br from-feevert-green to-green-700 flex items-center justify-center relative overflow-hidden">
        <i className="fas fa-chart-line text-5xl text-white/50 group-hover:scale-110 transition-transform duration-300"></i>
        {project.is_featured && (
          <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 group-hover:text-feevert-green transition-colors line-clamp-1">
          {project.title}
        </h3>
        <p className="text-feevert-green text-sm mb-2">
          <i className="fas fa-user mr-1"></i> {project.client_name || 'Client'}
        </p>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        <Link to={`/projects/${project.id}`} className="text-feevert-green font-semibold text-sm hover:underline">
          View Details →
        </Link>
      </div>
    </div>
  )
}
export default ProjectCard
