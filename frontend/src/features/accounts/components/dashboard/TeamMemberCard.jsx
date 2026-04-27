import React from 'react'
import { Link } from 'react-router-dom'

const TeamMemberCard = ({ member, darkMode }) => (
  <Link 
    to={`/team/${member.id}`} 
    className="text-center p-4 rounded-xl glass card-interactive block"
  >
    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[var(--g-color-primary)] to-[var(--g-color-primary-dark)] rounded-full flex items-center justify-center mb-3 shadow-lg">
      <span className="text-white font-bold text-lg">
        {member.full_name?.charAt(0) || '?'}
      </span>
    </div>
    <h3 className="font-medium text-sm text-[var(--g-text-primary)]">
      {member.full_name}
    </h3>
    <p className="text-xs text-[var(--g-color-primary)] font-medium">
      {member.role}
    </p>
  </Link>
)

export default TeamMemberCard