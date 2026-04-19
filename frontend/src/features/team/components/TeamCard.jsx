import React from 'react'
import { Link } from 'react-router-dom'

const TeamCard = ({ member }) => {
  return (
    <Link to={`/team/${member.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 text-center">
        <div className="pt-8 pb-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-feevert-green to-green-700 rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
            <i className="fas fa-user text-5xl text-white"></i>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-xl font-bold mb-1 group-hover:text-feevert-green transition-colors">
            {member.full_name}
          </h3>
          <p className="text-feevert-green text-sm font-medium mb-3">{member.role}</p>
          <p className="text-gray-500 text-sm line-clamp-3">{member.bio}</p>
        </div>
      </div>
    </Link>
  )
}
export default TeamCard
