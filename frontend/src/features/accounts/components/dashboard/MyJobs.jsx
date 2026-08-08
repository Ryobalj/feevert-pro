// src/features/accounts/components/dashboard/MyJobs.jsx
//
// Staff work panel: the jobs (consultation requests) assigned to the logged-in
// staff member, with the full workflow — start work, mark completed, upload the
// finished deliverable (e.g. an MS Office file), and send it to the client.

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../app/api'

const STATUS_BADGE = {
  pending:     { label: 'New',         cls: 'bg-white/10 text-white/70' },
  confirmed:   { label: 'Assigned',    cls: 'bg-blue-500/15 text-blue-300' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-500/15 text-amber-300' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-500/15 text-emerald-300' },
  delivered:   { label: 'Delivered',   cls: 'bg-emerald-500/25 text-emerald-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-500/15 text-red-300' },
}

const MyJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [busy, setBusy] = useState(null) // job id currently performing an action

  const load = useCallback(async () => {
    try {
      const res = await api.get('/consultation-requests/?assigned_to=me')
      setJobs(res.data?.results || res.data || [])
    } catch (e) {
      console.error('Error loading jobs:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setStatus = async (job, status) => {
    setBusy(job.id)
    try {
      await api.post(`/consultation-requests/${job.id}/update_status/`, { status })
      await load()
    } catch (e) { console.error(e) } finally { setBusy(null) }
  }

  const uploadDeliverable = async (job, file) => {
    if (!file) return
    setBusy(job.id)
    try {
      const fd = new FormData()
      fd.append('request', job.id)
      fd.append('file', file)
      fd.append('title', file.name)
      fd.append('document_type', 'report')
      fd.append('is_deliverable', 'true')
      await api.post('/consultation-documents/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await load()
    } catch (e) { console.error('Upload failed:', e) } finally { setBusy(null) }
  }

  const sendToClient = async (job) => {
    setBusy(job.id)
    try {
      const deliverableIds = (job.documents || [])
        .filter(d => d.is_deliverable).map(d => d.id)
      await api.post(`/consultation-requests/${job.id}/deliver/`, { document_ids: deliverableIds })
      await load()
    } catch (e) { console.error('Deliver failed:', e) } finally { setBusy(null) }
  }

  if (loading) {
    return (
      <div className="glass-card p-6 mb-6">
        <div className="text-center py-8 text-white/40 text-sm">Loading your jobs…</div>
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
          <span className="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm">🗂️</span>
          My Jobs
        </h2>
        <span className="text-xs text-white/40">{jobs.length} assigned</span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">No jobs assigned to you yet.</div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const badge = STATUS_BADGE[job.status] || STATUS_BADGE.pending
            const isOpen = openId === job.id
            const inputDocs = (job.documents || []).filter(d => !d.is_deliverable)
            const deliverables = (job.documents || []).filter(d => d.is_deliverable)
            const working = busy === job.id
            return (
              <div key={job.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setOpenId(isOpen ? null : job.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{job.service_name || 'Service'}</div>
                    <div className="text-xs text-white/40 truncate">
                      {job.client_name || job.client_email || 'Client'} · {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
                  <svg className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Expanded body */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/5">
                    {job.message && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Client message</div>
                        <p className="text-sm text-white/70 whitespace-pre-line">{job.message}</p>
                      </div>
                    )}

                    {/* Input documents from client */}
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Input files</div>
                      {inputDocs.length > 0 ? (
                        <ul className="space-y-1">
                          {inputDocs.map(d => (
                            <li key={d.id}>
                              <a href={d.file_url} target="_blank" rel="noreferrer"
                                 className="text-sm text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
                                📎 {d.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-white/30">None</p>}
                    </div>

                    {/* Deliverables uploaded */}
                    {deliverables.length > 0 && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-white/30 mb-1">Deliverables</div>
                        <ul className="space-y-1">
                          {deliverables.map(d => (
                            <li key={d.id}>
                              <a href={d.file_url} target="_blank" rel="noreferrer"
                                 className="text-sm text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1">
                                ✅ {d.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {job.status !== 'delivered' && (
                        <>
                          {job.status !== 'in_progress' && job.status !== 'completed' && (
                            <button disabled={working} onClick={() => setStatus(job, 'in_progress')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 disabled:opacity-40 transition-colors">
                              ▶ Start work
                            </button>
                          )}
                          {job.status !== 'completed' && (
                            <button disabled={working} onClick={() => setStatus(job, 'completed')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40 transition-colors">
                              ✓ Mark completed
                            </button>
                          )}

                          <label className={`px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer transition-colors ${working ? 'opacity-40 pointer-events-none' : ''}`}>
                            ⬆ Upload deliverable
                            <input type="file" className="hidden"
                              onChange={e => uploadDeliverable(job, e.target.files?.[0])} />
                          </label>

                          <button
                            disabled={working || deliverables.length === 0}
                            onClick={() => sendToClient(job)}
                            title={deliverables.length === 0 ? 'Upload a deliverable first' : 'Send to client'}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto">
                            📤 Send to client
                          </button>
                        </>
                      )}
                      {job.status === 'delivered' && (
                        <span className="text-xs text-emerald-300 font-medium ml-auto">Delivered to client ✓</span>
                      )}
                    </div>
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

export default MyJobs
