import React from 'react'
import { Link } from 'react-router-dom'

const TeamCard = ({ member }) => {
  const gradients = [
    'from-emerald-400 via-green-500 to-teal-600',
    'from-green-400 via-emerald-500 to-cyan-600',
    'from-teal-400 via-cyan-500 to-emerald-600',
    'from-emerald-500 via-teal-500 to-green-600',
    'from-cyan-400 via-emerald-500 to-teal-600',
    'from-green-500 via-teal-400 to-emerald-600',
  ]
  const gradient = gradients[member.id ? member.id % gradients.length : 0]

  return (
    <Link to={`/team/${member.id}`} className="block group h-full">
      <div className="glass-card text-center h-full flex flex-col items-center relative overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />

        <div className="p-6 flex flex-col items-center h-full relative z-10">
          {/* Avatar */}
          <div className="relative mb-5">
            {/* Glow ring */}
            <div className="absolute -inset-1 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-md transition-all duration-500" />
            
            {member.profile_picture || member.photo || member.image ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500">
                <img 
                  src={member.profile_picture || member.photo || member.image} 
                  alt={member.full_name || member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/0 to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />
              </div>
            ) : (
              <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ring-2 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500 shadow-lg`}>
                <span className="text-3xl font-bold text-white drop-shadow-md">
                  {(member.full_name || member.name || '?').charAt(0)}
                </span>
              </div>
            )}

            {/* Online Status */}
            {member.is_active !== undefined && (
              <span className={`absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full ring-2 ring-[#0d3320] ${
                member.is_active 
                  ? 'bg-emerald-400 animate-pulse' 
                  : 'bg-white/20'
              }`} />
            )}
          </div>

          {/* Name */}
          <h3 className="font-bold text-white text-base mb-1 group-hover:text-emerald-400 transition-colors duration-300">
            {member.full_name || member.name}
          </h3>

          {/* Role */}
          <p className="text-xs font-semibold text-emerald-400/80 mb-3 uppercase tracking-wider">
            {member.role || member.position || 'Team Member'}
          </p>

          {/* Bio */}
          {member.bio && (
            <p className="text-xs text-white/40 line-clamp-2 mb-4 leading-relaxed">
              {member.bio}
            </p>
          )}

          {/* Animated Divider */}
          <div className="w-10 h-0.5 bg-white/10 rounded-full mt-auto mb-4 group-hover:w-16 group-hover:bg-emerald-400/30 transition-all duration-500" />

          {/* Social / Contact */}
          <div className="flex items-center gap-2">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:scale-110 transition-all duration-300"
                title="Email"
              >
                <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            )}
            {member.linkedin_url && (
              <a
                href={member.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:scale-110 transition-all duration-300"
                title="LinkedIn"
              >
                <span className="text-white/60 text-xs font-bold">in</span>
              </a>
            )}
            {member.twitter_url && (
              <a
                href={member.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:scale-110 transition-all duration-300"
                title="Twitter"
              >
                <svg className="w-3.5 h-3.5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default TeamCard