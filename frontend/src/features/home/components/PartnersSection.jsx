import React from 'react'

const PartnersSection = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <h2 className="text-2xl font-semibold text-center mb-8">Trusted by</h2>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          {data.map((partner) => (
            <div key={partner.id} className="grayscale hover:grayscale-0 transition-all duration-300">
              {partner.logo ? (
                <img src={partner.logo} alt={partner.name} className="h-12 w-auto" />
              ) : (
                <div className="bg-gray-100 px-6 py-3 rounded-xl">
                  <span className="text-gray-500 font-semibold">{partner.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
export default PartnersSection
