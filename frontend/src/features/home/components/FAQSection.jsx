import React, { useState } from 'react'

const FAQSection = ({ data }) => {
  const [openIndex, setOpenIndex] = useState(null)

  if (!data || data.length === 0) return null

  return (
    <section className="py-20">
      <div className="container-custom">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Got questions? We've got answers</p>
        <div className="max-w-3xl mx-auto space-y-4">
          {data.map((faq, index) => (
            <div key={faq.id} className="bg-white rounded-2xl shadow-md overflow-hidden animate-on-scroll">
              <button
                className="w-full px-6 py-4 text-left font-semibold flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                <i className={`fas fa-chevron-${openIndex === index ? 'up' : 'down'} text-feevert-green transition-transform`}></i>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 border-t pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
export default FAQSection
