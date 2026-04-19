import React from 'react'
import { Link } from 'react-router-dom'
import TeamCard from '../../team/components/TeamCard'

const TeamSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const featuredTeam = data.filter(m => m.is_featured).slice(0, 4)

  if (featuredTeam.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="section-badge inline-block bg-feevert-light text-feevert-green px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Our Experts
          </div>
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-subtitle">The passionate professionals behind FeeVert</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredTeam.map((member, index) => (
            <div key={member.id} className="animate-on-scroll" style={{ animationDelay: `${index * 0.1}s` }}>
              <TeamCard member={member} />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/team" className="btn-outline">
            Meet All Team Members <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  )
}
export default TeamSection
