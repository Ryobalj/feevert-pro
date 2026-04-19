import React from 'react'

const HeroSection = ({ data }) => {
  if (!data) {
    return (
      <section className="py-20 border-b border-[var(--border-primary)]">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">FeeVert Consultancy</h1>
            <p className="text-[var(--text-secondary)] mb-6">Expert consultancy in Agriculture, Environment & OHS</p>
            <button className="btn-primary">Get Started</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 border-b border-[var(--border-primary)]">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 scroll-animate" dangerouslySetInnerHTML={{ __html: data.title || 'FeeVert Consultancy' }} />
          <p className="text-[var(--text-secondary)] mb-6 scroll-animate delay-100">{data.subtitle || 'Expert consultancy in Agriculture, Environment & OHS'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center scroll-animate delay-200">
            <button className="btn-primary">Get Started</button>
            <button className="btn-outline">Learn more</button>
          </div>
        </div>
      </div>
    </section>
  )
}
export default HeroSection
