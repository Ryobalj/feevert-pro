import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const StatsSection = ({ services, projects, testimonials, siteSettings }) => {
  const [counters, setCounters] = useState({ projects: 0, clients: 0, services: 0, years: 0 })
  const [hasAnimated, setHasAnimated] = useState(false)
  const sectionRef = useRef(null)

  const targetProjects = projects?.length || 0
  const targetClients = testimonials?.length || 0
  const targetServices = services?.length || 0
  const targetYears = siteSettings?.years_experience || 0

  const hasStats = targetProjects > 0 || targetClients > 0 || targetServices > 0 || targetYears > 0

  useEffect(() => {
    if (!hasStats || hasAnimated) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true)
          
          const duration = 2000
          const steps = 60
          const interval = duration / steps
          let step = 0

          const timer = setInterval(() => {
            step++
            const progress = step / steps
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            
            setCounters({
              projects: Math.floor(targetProjects * easeProgress),
              clients: Math.floor(targetClients * easeProgress),
              services: Math.floor(targetServices * easeProgress),
              years: Math.floor(targetYears * easeProgress),
            })
            
            if (step >= steps) {
              setCounters({ 
                projects: targetProjects, 
                clients: targetClients, 
                services: targetServices, 
                years: targetYears 
              })
              clearInterval(timer)
            }
          }, interval)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [hasStats, hasAnimated, targetProjects, targetClients, targetServices, targetYears])

  if (!hasStats) return null

  const stats = [
    { value: counters.projects, suffix: '+', label: 'Projects Completed', icon: '📁', color: 'emerald' },
    { value: counters.clients, suffix: '+', label: 'Happy Clients', icon: '😊', color: 'green' },
    { value: counters.services, suffix: '+', label: 'Services Offered', icon: '🛠️', color: 'teal' },
    { value: counters.years, suffix: '+', label: 'Years Experience', icon: '📅', color: 'emerald' },
  ].filter(stat => {
    if (stat.label === 'Projects Completed') return targetProjects > 0
    if (stat.label === 'Happy Clients') return targetClients > 0
    if (stat.label === 'Services Offered') return targetServices > 0
    if (stat.label === 'Years Experience') return targetYears > 0
    return true
  })

  if (stats.length === 0) return null

  const gridCols = stats.length <= 2 
    ? 'grid-cols-2 max-w-lg' 
    : stats.length === 3 
      ? 'grid-cols-3 max-w-2xl' 
      : 'grid-cols-2 md:grid-cols-4'

  return (
    <section ref={sectionRef} className="relative py-16 md:py-20 overflow-hidden">
      {/* Top & Bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent" />
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] via-green-500/[0.03] to-emerald-500/[0.02]" />
      
      <div className="container-main relative z-10">
        <div className={`grid gap-5 mx-auto ${gridCols}`}>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <div className="glass-card text-center relative overflow-hidden group hover:border-emerald-400/20 transition-all duration-300">
                {/* Background accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/30 transition-all duration-500" />
                
                <div className="p-6 relative z-10">
                  {/* Icon with glow */}
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-emerald-400/0 group-hover:bg-emerald-400/10 rounded-full blur-lg transition-all duration-500" />
                    <span className="relative text-3xl">
                      {stat.icon}
                    </span>
                  </div>

                  {/* Animated Counter */}
                  <motion.div 
                    className="text-4xl md:text-5xl font-extrabold gradient-text mb-2"
                    key={hasAnimated ? 'animated' : 'static'}
                  >
                    {stat.value}{stat.suffix}
                  </motion.div>

                  {/* Label */}
                  <p className="text-white/50 text-sm font-medium">
                    {stat.label}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, delay: index * 0.2, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection