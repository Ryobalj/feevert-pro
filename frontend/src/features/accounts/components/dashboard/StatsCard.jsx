import React from 'react'
import { Link } from 'react-router-dom'

const StatsCard = ({ label, value, icon, link, color }) => {
  const colors = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-green-600 to-green-800',
    purple: 'from-purple-600 to-purple-800',
    yellow: 'from-yellow-600 to-yellow-800',
  }
  
  const CardWrapper = link ? Link : 'div'
  
  return (
    <CardWrapper to={link} className={`modern-card p-5 ${link ? 'cursor-pointer hover:shadow-lg' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color] || colors.blue} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </CardWrapper>
  )
}

export default StatsCard
