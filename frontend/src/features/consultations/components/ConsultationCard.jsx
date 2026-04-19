import React from 'react'
import { Link } from 'react-router-dom'

const ConsultationCard = ({ consultation }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold">{consultation.service_name || 'Consultation'}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[consultation.status] || 'bg-gray-100'}`}>
          {consultation.status?.toUpperCase()}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{consultation.message?.substring(0, 100)}...</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          <i className="fas fa-calendar mr-1"></i> {new Date(consultation.preferred_date).toLocaleDateString()}
        </span>
        <Link to={`/consultations/${consultation.id}`} className="text-feevert-green hover:underline">View Details →</Link>
      </div>
    </div>
  )
}
export default ConsultationCard
