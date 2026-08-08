// src/features/accounts/components/dashboard/ClientJobs.jsx
//
// Client-facing view of their jobs (consultation requests): a step-by-step
// progress timeline and downloads of the delivered work.

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../app/api'

const STEPS = [
  { key: 'pending',     label: 'Submitted' },
  { key: 'confirmed',   label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed',   label: 'Completed' },
  { key: 'delivered',   label: 'Delivered' },
]

const Timeline = ({ status }) => {
  if (status === 'cancelled') {
    return <div className="text-xs font-semibold text-red-300">This request was cancelled.</div>
  }
  const current = Math.max(0, STEPS.findIndex(s => s.key === status))
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i <= current
        const isLast = i === STEPS.length - 1
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-[10px] text-center leading-tight ${done ? 'text-emerald-300' : 'text-white/30'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${i < current ? 'bg-emerald-500' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const ClientJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/consultation-requests/')
      setJobs(res.data?.results || res.data || [])
    } catch (e) {
      console.error('Error loading requests:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="glass-card p-6 mb-6">
        <div className="text-center py-8 text-white/40 text-sm">Loading your requests…</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">📈</span>
          My Requests
        </h2>
        <span className="text-xs text-white/40">{jobs.length} total</span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">You have no requests yet.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => {
            const deliverables = (job.documents || []).filter(d => d.is_deliverable)
            return (
              <div key={job.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{job.item_name || job.service_name || 'Service'}</div>
                    <div className="text-xs text-white/40">
                      Requested {new Date(job.created_at).toLocaleDateString()}
                      {job.assigned_to_name ? ` · Specialist: ${job.assigned_to_name}` : ''}
                    </div>
                  </div>
                </div>

                <Timeline status={job.status} />

                {/* Deliverables */}
                {deliverables.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Your deliverables</div>
                    <ul className="space-y-1">
                      {deliverables.map(d => (
                        <li key={d.id}>
                          <a href={d.file_url} target="_blank" rel="noreferrer"
                             className="text-sm text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1">
                            ⬇ {d.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

export default ClientJobs
