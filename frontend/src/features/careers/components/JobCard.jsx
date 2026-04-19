import React from 'react'
import { Link } from 'react-router-dom'

const JobCard = ({ job }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold hover:text-feevert-green transition-colors">
          <Link to={`/careers/${job.id}`}>{job.title}</Link>
        </h3>
        {job.is_featured && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Featured</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
        <span><i className="fas fa-map-marker-alt mr-1"></i> {job.location || 'Various'}</span>
        <span><i className="fas fa-clock mr-1"></i> {job.employment_type?.replace('_', ' ').toUpperCase()}</span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          <i className="far fa-calendar-alt mr-1"></i> Deadline: {new Date(job.deadline).toLocaleDateString()}
        </span>
        <Link to={`/careers/${job.id}`} className="text-feevert-green text-sm font-semibold hover:underline">
          Apply Now →
        </Link>
      </div>
    </div>
  )
}
export default JobCard
