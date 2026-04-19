import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../app/api'

const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [projects, setProjects] = useState([])
  const [team, setTeam] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [faqs, setFaqs] = useState([])
  const [partners, setPartners] = useState([])
  const [counters, setCounters] = useState({ projects: 0, clients: 0, years: 0 })

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [servicesRes, projectsRes, teamRes, testimonialsRes, faqRes, partnersRes] = await Promise.all([
          api.get('/consultation-services/'),
          api.get('/projects/'),
          api.get('/team-members/'),
          api.get('/testimonials/'),
          api.get('/faqs/'),
          api.get('/partners/')
        ])
        
        const extractData = (res) => {
          if (res.data?.results) return res.data.results
          if (Array.isArray(res.data)) return res.data
          return []
        }
        
        const servicesData = extractData(servicesRes)
        const projectsData = extractData(projectsRes)
        const teamData = extractData(teamRes)
        const testimonialsData = extractData(testimonialsRes)
        const faqData = extractData(faqRes)
        const partnersData = extractData(partnersRes)
        
        console.log('Loaded:', {
          services: servicesData.length,
          projects: projectsData.length,
          team: teamData.length,
          testimonials: testimonialsData.length,
          faqs: faqData.length,
          partners: partnersData.length
        })
        
        setServices(servicesData)
        setProjects(projectsData)
        setTeam(teamData)
        setTestimonials(testimonialsData)
        setFaqs(faqData)
        setPartners(partnersData)
        
        // Animate counters
        const targetProjects = projectsData.length || 9
        const targetClients = testimonialsData.length || 48
        
        const duration = 2000
        const steps = 60
        const interval = duration / steps
        let step = 0
        
        const timer = setInterval(() => {
          step++
          const progress = step / steps
          setCounters({
            projects: Math.floor(targetProjects * progress),
            clients: Math.floor(targetClients * progress),
            years: Math.floor(5 * progress)
          })
          if (step >= steps) {
            setCounters({ projects: targetProjects, clients: targetClients, years: 5 })
            clearInterval(timer)
          }
        }, interval)
        
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAllData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Stats Section */}
      <section className="py-10 bg-green-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">{counters.projects}+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Projects</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">{counters.clients}+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Happy Clients</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">{counters.years}+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Years Experience</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">24/7</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Our Services</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">Comprehensive solutions tailored to your needs</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.slice(0, 6).map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/services/${service.id}`}>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md transition-all h-full">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{service.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">{service.description}</p>
                    {service.price && (
                      <p className="text-green-700 dark:text-green-400 font-medium text-xs">
                        From TZS {parseInt(service.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-6">
            <Link to="/services" className="text-green-700 dark:text-green-400 text-sm hover:underline">
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
        <div className="container-main">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Featured Projects</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">Success stories from our clients</p>
          
          {projects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/projects/${project.id}`}>
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all h-full">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{project.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">{project.description}</p>
                        <span className="text-green-700 dark:text-green-400 text-xs">{project.category_name || 'Project'}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link to="/projects" className="text-green-700 dark:text-green-400 text-sm hover:underline">
                  View All Projects →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">No projects yet.</p>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Meet Our Team</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">Passionate professionals dedicated to your success</p>
          
          {team.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {team.slice(0, 4).map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/team/${member.id}`}>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-all h-full">
                        <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center mb-2">
                          <span className="text-lg font-bold text-white">{member.full_name?.charAt(0) || '?'}</span>
                        </div>
                        <h3 className="font-medium text-gray-800 dark:text-white text-sm">{member.full_name}</h3>
                        <p className="text-green-700 dark:text-green-400 text-xs">{member.role || member.position}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link to="/team" className="text-green-700 dark:text-green-400 text-sm hover:underline">
                  Meet the Whole Team →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Team members coming soon!</p>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-12 bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
          <div className="container-main">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">What Clients Say</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">Don't just take our word for it</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.slice(0, 3).map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
                    <div className="flex gap-1 mb-2 text-yellow-400 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < (t.rating || 5) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs italic mb-2">"{t.content?.substring(0, 80)}..."</p>
                    <p className="font-medium text-gray-800 dark:text-white text-xs">{t.client_name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-12">
          <div className="container-main max-w-3xl">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">Got questions? We've got answers</p>
            
            <div className="space-y-2">
              {faqs.slice(0, 5).map((faq, i) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-medium text-gray-800 dark:text-white text-sm mb-1">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 text-white">
        <div className="container-main text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Ready to Get Started?</h2>
          <p className="text-sm opacity-90 mb-4">Contact us today for a free consultation</p>
          <Link to="/contact">
            <button className="bg-white text-green-700 dark:bg-gray-900 dark:text-green-400 px-5 py-2 rounded-full font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Contact Us Now →
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
