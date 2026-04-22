import React from 'react'
import { Link } from 'react-router-dom'

const TeamMemberCard = ({ member, darkMode }) => (
  <Link to={`/team/${member.id}`} className="text-center">
    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center mb-2">
      <span className="text-white font-bold">{member.full_name?.charAt(0) || '?'}</span>
    </div>
    <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member.full_name}</h3>
    <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{member.role}</p>
  </Link>
)

export default TeamMemberCard
