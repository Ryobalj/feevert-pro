// src/features/accounts/components/dashboard/TeamMemberCard.jsx

import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TeamMemberCard = ({ member, darkMode }) => {
  const { t } = useTranslation('admin')

  return (
    <Link 
      to={`/team/${member?.id}`} 
      className="text-center p-4 rounded-xl glass card-interactive block group"
    >
      <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[var(--g-color-primary)] to-[var(--g-color-primary-dark)] rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
        <span className="text-white font-bold text-lg">
          {member?.full_name?.charAt(0) || '?'}
        </span>
      </div>
      <h3 className="font-medium text-sm text-[var(--g-text-primary)] group-hover:text-emerald-400 transition-colors duration-300">
        {member?.full_name}
      </h3>
      <p className="text-xs text-[var(--g-color-primary)] font-medium">
        {member?.role || t('team.member')}
      </p>
    </Link>
  )
}

export default TeamMemberCard