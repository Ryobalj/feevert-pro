import React from 'react'

const CTASection = ({ data }) => {
  return (
    <section className="py-20 bg-feevert-green text-white">
      <div className="container-custom text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
          Contact us today for a free consultation and let us help you achieve your goals.
        </p>
        <button 
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-white text-feevert-green px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all hover:-translate-y-1"
        >
          Contact Us Now
        </button>
      </div>
    </section>
  )
}
export default CTASection
