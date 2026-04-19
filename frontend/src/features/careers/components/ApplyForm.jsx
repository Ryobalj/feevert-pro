import React, { useState } from 'react'
import api from '../../../app/api'
import { useAuth } from '../../accounts/hooks/useAuth'

const ApplyForm = ({ jobId, onClose }) => {
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cover_letter: '',
    cv_file: null
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, cv_file: e.target.files[0] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Please login to apply for this position')
      return
    }
    if (!formData.cv_file) {
      alert('Please upload your CV')
      return
    }

    setLoading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('job', jobId)
      formDataObj.append('full_name', formData.full_name)
      formDataObj.append('email', formData.email)
      formDataObj.append('phone', formData.phone)
      formDataObj.append('cover_letter', formData.cover_letter)
      formDataObj.append('cv_file', formData.cv_file)

      await api.post('/job-applications/', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 3000)
    } catch (error) {
      console.error('Error applying:', error)
      alert('Error submitting application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">We'll review your application and get back to you soon.</p>
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Apply for Position</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
              <textarea
                name="cover_letter"
                rows="4"
                value={formData.cover_letter}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-feevert-green focus:outline-none"
                placeholder="Tell us why you're a good fit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CV/Resume *</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
export default ApplyForm
