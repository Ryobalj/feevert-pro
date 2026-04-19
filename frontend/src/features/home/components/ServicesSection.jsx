import React from 'react'
import { Link } from 'react-router-dom'

const ServicesSection = ({ data }) => {
  if (!data || data.length === 0) return null

  const displayedServices = data.slice(0, 6)

  return (
    <section id="services" className="py-20">
      <div className="container-custom">
        <h2 className="section-title">Our Core Services</h2>
        <p className="section-subtitle">Comprehensive solutions tailored to your needs</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedServices.map((service, index) => (
            <div key={service.id} className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 animate-on-scroll" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="text-4xl mb-4">{service.icon || '📌'}</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-feevert-green transition-colors">{service.name}</h3>
              <p className="text-gray-600">{service.description}</p>
              {service.price && <p className="mt-3 text-feevert-green font-semibold">TZS {service.price.toLocaleString()}</p>}
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/services" className="btn-outline">View All Services →</Link>
        </div>
      </div>
    </section>
  )
}
export default ServicesSection
