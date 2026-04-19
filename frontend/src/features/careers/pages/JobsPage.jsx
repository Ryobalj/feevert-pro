import React, { useState, useEffect } from 'react'
import api from '../../../app/api'
import Loader from '../../../components/ui/Loader'

const JobsPage = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get('/jobs/')
        const jobsData = res.data.results || res.data
        setJobs(Array.isArray(jobsData) ? jobsData : [])
      } catch (error) {
        console.error('Error loading jobs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  if (loading) return <Loader />

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Career Opportunities</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">Join our team of passionate professionals</p>
        <div className="grid md:grid-cols-2 gap-8">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold mb-2">{job.title}</h3>
              <p className="text-feevert-green text-sm mb-3">{job.location} • {job.employment_type}</p>
              <p className="text-gray-600 mb-4">{job.description?.substring(0, 150)}...</p>
              <button className="btn-primary text-sm py-2 px-4">Apply Now</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default JobsPage
