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

  // Social links
  const socialLinks = []
  if (member.email) socialLinks.push({ icon: '✉️', href: `mailto:${member.email}`, label: 'Email' })
  if (member.linkedin_url) socialLinks.push({ icon: '🔗', href: member.linkedin_url, label: 'LinkedIn' })
  if (member.twitter_url) socialLinks.push({ icon: '🐦', href: member.twitter_url, label: 'Twitter' })

  return (
    <Link to={`/team/${member.id}`} className="block group h-full">
      <div className="glass-card text-center h-full flex flex-col items-center relative overflow-hidden hover:border-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover:from-emerald-400/20 group-hover:via-emerald-400/40 group-hover:to-emerald-400/20 transition-all duration-500" />

        <div className="p-6 flex flex-col items-center h-full relative z-10">
          {/* Avatar */}
          <div className="relative mb-5">
            {/* Glow ring */}
            <div className="absolute -inset-2 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-md transition-all duration-500" />
            
            {member.profile_picture || member.photo || member.image ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-3 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500">
                <img 
                  src={member.profile_picture || member.photo || member.image} 
                  alt={member.full_name || member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/0 to-transparent group-hover:from-emerald-500/20 transition-all duration-500" />
              </div>
            ) : (
              <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ring-3 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-500 shadow-lg`}>
                <span className="text-3xl font-bold text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                  {(member.full_name || member.name || '?').charAt(0)}
                </span>
              </div>
            )}

            {/* Online/Active indicator */}
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
          <p className="text-xs font-semibold text-emerald-400/80 mb-2 uppercase tracking-wider">
            {member.role || member.position || 'Team Member'}
          </p>

          {/* Department */}
          {member.department && (
            <p className="text-[10px] text-white/30 mb-3">
              {member.department}
            </p>
          )}

          {/* Bio */}
          {member.bio && (
            <p className="text-xs text-white/40 line-clamp-2 mb-4 leading-relaxed">
              {member.bio}
            </p>
          )}

          {/* Animated Divider */}
          <div className="w-10 h-0.5 bg-white/10 rounded-full mt-auto mb-4 group-hover:w-16 group-hover:bg-emerald-400/30 transition-all duration-500" />

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:scale-110 transition-all duration-300"
                  title={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default TeamCard