import React from 'react'
import { Link } from 'react-router-dom'
import ProjectCard from '../../projects/components/ProjectCard'

const ProjectsSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const featuredProjects = data.filter(p => p.is_featured).slice(0, 3)

  if (featuredProjects.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="section-badge inline-block bg-feevert-light text-feevert-green px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Our Portfolio
          </div>
          <h2 className="section-title">Featured Projects</h2>
          <p className="section-subtitle">Some of our successful projects that showcase our expertise</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <div key={project.id} className="animate-on-scroll" style={{ animationDelay: `${index * 0.1}s` }}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/projects" className="btn-outline">
            View All Projects <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  )
}
export default ProjectsSection
