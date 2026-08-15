// src/features/accounts/pages/WorkspacePage.jsx
//
// The staff work area: an icon rail on the left, and the tools people actually
// need to get through a day — what's assigned to them, their notes, the
// calendar of appointments, and a summary of the work.

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'
import { useAuth } from '../hooks/useAuth'
import DraftTools from '../components/workspace/DraftTools'
import FinancePanel from '../components/workspace/FinancePanel'
import CalculatorPopup from '../components/workspace/CalculatorPopup'
import useAutoRefresh from '../../../app/useAutoRefresh'

const SECTIONS = [
  { key: 'overview', label: 'Overview',  icon: '📊' },
  // Shown only to the accountant — see canFinance below.
  { key: 'finance',  label: 'Finance',   icon: '💰', financeOnly: true },
  { key: 'tasks',    label: 'Tasks',     icon: '✅' },
  { key: 'calendar', label: 'Calendar',  icon: '📅' },
  { key: 'notes',    label: 'Notes',     icon: '📝' },
  { key: 'drafts',   label: 'Drafts',    icon: '✍️' },
  { key: 'files',    label: 'Documents', icon: '📄' },
  { key: 'calc',     label: 'Calculator', icon: '🧮' },
  { key: 'reports',  label: 'Reports',   icon: '📈' },
]

const NOTE_COLORS = {
  yellow: 'bg-amber-400/15 border-amber-400/30',
  green:  'bg-emerald-400/15 border-emerald-400/30',
  blue:   'bg-blue-400/15 border-blue-400/30',
  pink:   'bg-pink-400/15 border-pink-400/30',
  purple: 'bg-purple-400/15 border-purple-400/30',
}

const STATUS_STYLE = {
  todo:        'bg-white/10 text-white/70',
  in_progress: 'bg-amber-500/15 text-amber-300',
  done:        'bg-emerald-500/15 text-emerald-300',
  cancelled:   'bg-red-500/15 text-red-300',
}

const WorkspacePage = () => {
  // Refetches when the tab comes back to the front, and on a slow timer —
  // otherwise a page left open keeps showing yesterday's content.
  const refresh = useAutoRefresh()
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const [section, setSection] = useState('overview')
  const [canFinance, setCanFinance] = useState(false)

  // Who sees the money is a backend decision; ask it rather than guessing from
  // a role name here.
  useEffect(() => {
    api.get('/workspace/finance/?days=1')
      .then(() => setCanFinance(true))
      .catch(() => setCanFinance(false))
  }, [])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [jobs, setJobs] = useState([])
  const [bookings, setBookings] = useState([])
  const [mailUnread, setMailUnread] = useState(0)
  const [assignables, setAssignables] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState(null)
  const [emailSearch, setEmailSearch] = useState('')
  const [emailHits, setEmailHits] = useState([])
  const [savingTask, setSavingTask] = useState(false)
  const [uploadingTo, setUploadingTo] = useState(null)   // job id being uploaded to
  const [appointments, setAppointments] = useState([])
  const [people, setPeople] = useState([])      // staff, shown by default
  const [guestSearch, setGuestSearch] = useState('')
  const [searchHits, setSearchHits] = useState(null)   // null = show the staff list
  const [dayPanel, setDayPanel] = useState(null)   // { date: Date, form: {...}|null }
  const [savingEvent, setSavingEvent] = useState(false)
  // The calculator is a window now, not a page you have to go to —
  // you add up a quote while looking at the quote.
  const [calcOpen, setCalcOpen] = useState(false)

  const canDelegate = useMemo(() => {
    const role = (user?.role_name || user?.role?.name || '').toLowerCase()
    return role === 'admin' || role === 'consultant' || user?.is_superuser
  }, [user])

  const load = useCallback(async () => {
    try {
      const [tasksRes, notesRes, jobsRes, bookingsRes, mailRes, usersRes] = await Promise.all([
        api.get('/tasks/?page_size=200').catch(() => ({ data: { results: [] } })),
        api.get('/sticky-notes/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('/consultation-requests/?assigned_to=me&page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('/bookings/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('/email-inbox/mailboxes/').catch(() => ({ data: {} })),
        api.get('/tasks/assignable_users/').catch(() => ({ data: [] })),
      ])
      const pick = r => r.data?.results || r.data || []
      setTasks(pick(tasksRes))
      setNotes(pick(notesRes))
      setJobs(pick(jobsRes))
      setBookings(pick(bookingsRes))
      setMailUnread(mailRes.data?.unread || 0)
      setAssignables(usersRes.data || [])
    } catch (e) {
      console.error('workspace load failed', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refresh])

  useEffect(() => {
    api.get('/workspace/colleagues/')
      .then(res => setPeople(res.data || []))
      .catch(() => setPeople([]))
  }, [])

  const myTasks = useMemo(
    () => tasks.filter(t => String(t.assigned_to) === String(user?.id)),
    [tasks, user]
  )
  const openTasks = myTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const overdue = myTasks.filter(t => t.is_overdue)

  // Handing work out is for admins and consultants. For everybody else the
  // Tasks section only earns its place if they were actually given something —
  // they still need it to submit work for review.
  const visibleSections = useMemo(() => SECTIONS.filter(s => {
    if (s.financeOnly) return canFinance
    if (s.key === 'tasks') return canDelegate || myTasks.length > 0
    return true
  }), [canFinance, canDelegate, myTasks])

  // Never leave someone stranded on a section that just disappeared.
  useEffect(() => {
    if (!loading && !visibleSections.some(s => s.key === section)) setSection('overview')
  }, [visibleSections, section, loading])

  // Looking for the email that carried the work: searched, not scrolled —
  // there are a thousand messages in there.
  useEffect(() => {
    const term = emailSearch.trim()
    if (!newTask || term.length < 2) { setEmailHits([]); return }
    const id = setTimeout(() => {
      api.get(`/email-inbox/?search=${encodeURIComponent(term)}&page_size=8`)
        .then(res => setEmailHits(res.data?.results || res.data || []))
        .catch(() => setEmailHits([]))
    }, 300)
    return () => clearTimeout(id)
  }, [emailSearch, newTask])

  // ---- task actions
  const saveTask = async (e) => {
    e.preventDefault()
    if (!newTask?.title?.trim() || savingTask) return
    setSavingTask(true)
    try {
      const fields = {
        title: newTask.title.trim(),
        description: newTask.description || '',
        assigned_to: newTask.assigned_to || user?.id,
        priority: newTask.priority || 'medium',
        due_date: newTask.due_date || null,
        related_email: newTask.related_email || null,
      }
      if (newTask.file) {
        // A file can't ride in JSON, so the whole task goes as form data.
        const form = new FormData()
        Object.entries(fields).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') form.append(k, v)
        })
        form.append('attachment', newTask.file)
        await api.post('/tasks/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/tasks/', fields)
      }
      setNewTask(null)
      setEmailSearch('')
      setEmailHits([])
      load()
    } catch (err) {
      const d = err.response?.data
      alert(d?.detail || (d && Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' · '))
        || t('workspace.task_save_failed', 'Could not save the task'))
    } finally {
      setSavingTask(false)
    }
  }

  // Work goes back to whoever handed it out before it counts as done.
  const submitTask = async (task) => {
    try {
      const res = await api.post(`/tasks/${task.id}/submit/`)
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t))
    } catch (e) { alert(e.response?.data?.error || 'Could not submit') }
  }

  const reviewTask = async (task, approve) => {
    const notes = approve ? '' : (window.prompt('What still needs doing?') || '')
    if (!approve && !notes.trim()) return
    try {
      const res = await api.post(`/tasks/${task.id}/review/`, { approve, notes })
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t))
    } catch (e) { alert(e.response?.data?.error || 'Could not review') }
  }

  const setTaskStatus = async (task, status) => {
    try {
      await api.patch(`/tasks/${task.id}/`, { status })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t))
    } catch (err) { console.error(err) }
  }

  // ---- deliverables
  // The Documents section listed each job's files and then told you to go
  // somewhere else to add one. Upload happens here now.
  const uploadDeliverable = async (job, file, forClient) => {
    if (!file) return
    setUploadingTo(job.id)
    try {
      const form = new FormData()
      form.append('request', job.id)
      form.append('file', file)
      form.append('title', file.name)
      form.append('document_type', 'deliverable')
      form.append('is_deliverable', forClient ? 'true' : 'false')
      await api.post('/consultation-documents/', form,
        { headers: { 'Content-Type': 'multipart/form-data' } })
      await load()
    } catch (err) {
      const d = err.response?.data
      alert(d?.detail || (d && Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' · '))
        || t('workspace.upload_failed', 'Could not upload the file'))
    } finally {
      setUploadingTo(null)
    }
  }

  // ---- note actions
  const addNote = async () => {
    const colors = Object.keys(NOTE_COLORS)
    try {
      const res = await api.post('/sticky-notes/', {
        content: '', color: colors[notes.length % colors.length],
      })
      setNotes(prev => [res.data, ...prev])
    } catch (err) { console.error(err) }
  }

  const saveNote = async (note, content) => {
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content } : n))
    try { await api.patch(`/sticky-notes/${note.id}/`, { content }) } catch (e) { console.error(e) }
  }

  const deleteNote = async (note) => {
    setNotes(prev => prev.filter(n => n.id !== note.id))
    try { await api.delete(`/sticky-notes/${note.id}/`) } catch (e) { console.error(e) }
  }

  // ---- calendar (this month)
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })

  // Appointments are fetched a month at a time, following the arrows, rather
  // than pulling a year nobody is looking at.
  const loadAppointments = useCallback(async () => {
    const from = new Date(month.getFullYear(), month.getMonth(), 1)
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
    try {
      const res = await api.get(
        `/calendar-events/?from=${from.toISOString()}&to=${to.toISOString()}&page_size=200`)
      setAppointments(res.data?.results || res.data || [])
    } catch (e) {
      console.error('calendar load failed', e)
      setAppointments([])
    }
  }, [month])

  useEffect(() => { loadAppointments() }, [loadAppointments])

  // Typing searches every account — an appointment is often with a client,
  // not a colleague, and the staff list alone cannot answer that.
  useEffect(() => {
    const term = guestSearch.trim()
    if (!term) { setSearchHits(null); return }
    const id = setTimeout(() => {
      api.get(`/workspace/colleagues/?search=${encodeURIComponent(term)}`)
        .then(res => setSearchHits(res.data || []))
        .catch(() => setSearchHits([]))
    }, 300)
    return () => clearTimeout(id)
  }, [guestSearch])

  const openDay = (day) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    setDayPanel({ date, form: null })
  }

  const startEvent = () => {
    const d = dayPanel?.date || new Date()
    setDayPanel(prev => ({
      ...prev,
      form: {
        title: '',
        kind: 'appointment',
        time: '09:00',
        duration: 60,
        location: '',
        description: '',
        remind_minutes: 30,
        attendees: [],
        guests: '',
      },
    }))
  }

  const saveEvent = async (e) => {
    e.preventDefault()
    const form = dayPanel?.form
    if (!form?.title.trim()) return
    setSavingEvent(true)
    try {
      const d = dayPanel.date
      const [hh, mm] = (form.time || '09:00').split(':').map(Number)
      const starts = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh || 0, mm || 0)
      const ends = new Date(starts.getTime() + (Number(form.duration) || 60) * 60000)
      await api.post('/calendar-events/', {
        title: form.title.trim(),
        description: form.description || '',
        location: form.location || '',
        kind: form.kind,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        remind_minutes: Number(form.remind_minutes) || 0,
        attendees: form.attendees,
        guests: form.guests || '',
      })
      setGuestSearch('')
      setDayPanel(prev => ({ ...prev, form: null }))
      await loadAppointments()
    } catch (err) {
      alert(err.response?.data?.detail || t('workspace.event_failed', 'Could not save the appointment'))
    } finally {
      setSavingEvent(false)
    }
  }

  const deleteEvent = async (ev) => {
    if (!window.confirm(t('workspace.delete_event_confirm', 'Delete this appointment?'))) return
    try {
      await api.delete(`/calendar-events/${ev.id}/`)
      await loadAppointments()
    } catch (err) {
      alert(err.response?.data?.error || t('workspace.event_delete_failed', 'Could not delete it'))
    }
  }
  const calendar = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startPad = first.getDay()
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const events = {}
    const add = (iso, item) => {
      if (!iso) return
      const d = new Date(iso)
      if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) return
      ;(events[d.getDate()] = events[d.getDate()] || []).push(item)
    }
    bookings.forEach(b => add(b.slot_info ? b.created_at : b.created_at, { kind: 'booking', label: b.service_name || b.category_name || 'Booking' }))
    jobs.forEach(j => add(j.preferred_date, { kind: 'job', label: j.item_name || j.service_name || 'Job' }))
    myTasks.forEach(tk => add(tk.due_date, { kind: 'task', label: tk.title }))
    appointments.forEach(ev => add(ev.starts_at, {
      kind: 'event',
      label: ev.all_day ? ev.title
        : `${new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${ev.title}`,
      event: ev,
    }))
    return { startPad, days, events }
  }, [month, bookings, jobs, myTasks, appointments])

  const Stat = ({ icon, label, value, tone = 'emerald', to }) => {
    const tones = {
      emerald: 'from-emerald-400 to-green-600',
      amber: 'from-amber-400 to-orange-500',
      blue: 'from-blue-400 to-cyan-600',
      purple: 'from-purple-400 to-violet-600',
    }
    const body = (
      <div className="glass-card p-4 h-full">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-lg`}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white leading-none">{value}</div>
            <div className="text-[11px] text-white/45 mt-1 truncate">{label}</div>
          </div>
        </div>
      </div>
    )
    return to ? <Link to={to} className="block">{body}</Link> : body
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner spinner-lg" />
          <p className="text-white/50">{t('loading', 'Loading your workspace…')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-5 md:py-8">
      <div className="container-main max-w-[1500px]">
        <div className="flex gap-4">

          {/* ---------- icon rail ---------- */}
          <aside className="hidden md:flex w-[86px] flex-shrink-0 flex-col gap-1 glass-card !p-2 h-fit sticky top-24">
            {visibleSections.map(s => (
              <button key={s.key}
                onClick={() => (s.key === 'calc' ? setCalcOpen(true) : setSection(s.key))}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                  section === s.key ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}>
                <span className="text-lg">{s.icon}</span>
                <span className="text-[10px] font-semibold">{s.label}</span>
              </button>
            ))}
          </aside>

          <main className="flex-1 min-w-0">
            {/* ---------- header ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  {t('workspace.title', 'My Workspace')}
                </h1>
                <p className="text-white/45 text-sm mt-0.5">
                  {user?.full_name || user?.username}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to="/email-inbox" className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white/80 text-sm font-semibold hover:bg-white/10">
                  📥 {t('workspace.inbox', 'Inbox')}{mailUnread > 0 && <span className="ml-1.5 text-emerald-400">{mailUnread}</span>}
                </Link>
                {/* Only admins and consultants hand work out, so this is the
                    one place it can be started from. */}
                {canDelegate && (
                  <button onClick={() => { setSection('tasks'); setNewTask({ title: '', assigned_to: user?.id, priority: 'medium' }) }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold">
                    ➕ {t('workspace.new_task', 'New task')}
                  </button>
                )}
              </div>
            </div>

            {/* mobile section tabs */}
            <div className="md:hidden flex gap-1 overflow-x-auto pb-3 mb-2">
              {visibleSections.map(s => (
                <button key={s.key}
                  onClick={() => (s.key === 'calc' ? setCalcOpen(true) : setSection(s.key))}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    section === s.key ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-white/60'
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* ---------- OVERVIEW ---------- */}
            {section === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat icon="✅" label={t('workspace.open_tasks', 'Open tasks')} value={openTasks.length} />
                  <Stat icon="⏰" label={t('workspace.overdue', 'Overdue')} value={overdue.length} tone="amber" />
                  <Stat icon="🗂️" label={t('workspace.my_jobs', 'My jobs')} value={jobs.length} tone="blue" to="/dashboard" />
                  <Stat icon="📥" label={t('workspace.unread_mail', 'Unread mail')} value={mailUnread} tone="purple" to="/email-inbox" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-white">{t('workspace.todays_work', "Today's work")}</h2>
                      <button onClick={() => setSection('tasks')} className="text-[11px] text-emerald-400">{t('view_all', 'View all')}</button>
                    </div>
                    {openTasks.length === 0 ? (
                      <p className="text-white/30 text-sm py-6 text-center">{t('workspace.no_tasks', 'Nothing assigned right now')}</p>
                    ) : openTasks.slice(0, 6).map(tk => (
                      <div key={tk.id} className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
                        <button onClick={() => setTaskStatus(tk, 'done')}
                          className="w-4 h-4 rounded border border-white/25 hover:border-emerald-400 flex-shrink-0" title="Mark done" />
                        <span className="text-sm text-white/80 truncate flex-1">{tk.title}</span>
                        {tk.is_overdue && <span className="text-[10px] text-red-300">overdue</span>}
                      </div>
                    ))}
                  </div>

                  <div className="glass-card p-5">
                    <h2 className="text-sm font-bold text-white mb-3">{t('workspace.pinned_notes', 'Notes')}</h2>
                    {notes.length === 0 ? (
                      <button onClick={() => { setSection('notes'); addNote() }}
                        className="w-full py-6 text-sm text-white/40 hover:text-emerald-400">
                        + {t('workspace.add_note', 'Add your first note')}
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {notes.slice(0, 4).map(n => (
                          <div key={n.id} className={`rounded-xl border p-3 text-xs text-white/75 h-24 overflow-hidden ${NOTE_COLORS[n.color] || NOTE_COLORS.yellow}`}>
                            {n.content || <span className="text-white/30">Empty note</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------- TASKS ---------- */}
            {section === 'tasks' && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">
                    {canDelegate ? t('workspace.tasks', 'Tasks') : t('workspace.my_tasks', 'My tasks')}
                  </h2>
                  {/* The New task button lives in the page header, where it is
                      reachable from every section. A second one here (and a
                      third on the overview) only made people wonder whether
                      they did different things. */}
                </div>

                {newTask && (
                  <form onSubmit={saveTask} className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <input autoFocus value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder={t('workspace.task_title', 'What needs doing?')}
                      className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
                    <textarea value={newTask.description || ''} onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                      rows="2" placeholder={t('workspace.task_details', 'Details (optional)')}
                      className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-sm resize-none" />
                    <div className="flex flex-wrap gap-2">
                      {canDelegate && assignables.length > 0 && (
                        <select value={newTask.assigned_to || ''} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                          className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm">
                          {assignables.map(u => (
                            <option key={u.id} value={u.id} style={{ backgroundColor: '#0d3320', color: '#fff' }}>
                              {u.full_name || u.username}
                            </option>
                          ))}
                        </select>
                      )}
                      <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                        className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm">
                        {['low', 'medium', 'high', 'urgent'].map(p => (
                          <option key={p} value={p} style={{ backgroundColor: '#0d3320', color: '#fff' }}>{p}</option>
                        ))}
                      </select>
                      <input type="date" value={newTask.due_date || ''} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                        className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm" style={{ colorScheme: 'dark' }} />
                    </div>

                    {/* ---- what the work comes with -------------------- */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="px-3 py-2 rounded-lg bg-white/[0.06] text-white/70 text-xs font-semibold cursor-pointer hover:bg-white/10">
                        📎 {newTask.file ? newTask.file.name.slice(0, 28) : t('workspace.attach_file', 'Attach a document')}
                        <input type="file" className="hidden"
                          onChange={e => setNewTask({ ...newTask, file: e.target.files?.[0] || null })} />
                      </label>
                      {newTask.file && (
                        <button type="button" onClick={() => setNewTask({ ...newTask, file: null })}
                          className="text-[11px] text-white/40 hover:text-red-300">✕</button>
                      )}
                    </div>

                    {/* The email that carried the work. Searched rather than
                        listed — the mailbox holds a thousand messages. */}
                    <div>
                      {newTask.related_email ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15">
                          <span className="text-xs text-emerald-200 truncate flex-1">
                            ✉️ {newTask.related_email_subject || t('workspace.email_attached', 'Email attached')}
                          </span>
                          <button type="button"
                            onClick={() => setNewTask({ ...newTask, related_email: null, related_email_subject: '' })}
                            className="text-emerald-300/60 hover:text-red-300 text-xs">✕</button>
                        </div>
                      ) : (
                        <>
                          <input value={emailSearch} onChange={e => setEmailSearch(e.target.value)}
                            placeholder={t('workspace.search_email', 'Attach an email — search sender or subject…')}
                            className="w-full px-3 py-2 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-xs" />
                          {emailHits.length > 0 && (
                            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg bg-white/[0.03] border border-white/10">
                              {emailHits.map(m => (
                                <button type="button" key={m.id}
                                  onClick={() => {
                                    setNewTask({ ...newTask, related_email: m.id, related_email_subject: m.subject })
                                    setEmailSearch('')
                                    setEmailHits([])
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-white/[0.06] border-b border-white/[0.04] last:border-0">
                                  <p className="text-[12px] text-white/85 truncate">{m.subject || '(no subject)'}</p>
                                  <p className="text-[10px] text-white/40 truncate">
                                    {m.sender_name || m.sender} · {new Date(m.received_at).toLocaleDateString()}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="ml-auto flex gap-2">
                        <button type="button" onClick={() => { setNewTask(null); setEmailSearch(''); setEmailHits([]) }}
                          className="px-3 py-2 rounded-lg bg-white/[0.06] text-white/70 text-sm">{t('cancel', 'Cancel')}</button>
                        <button type="submit" disabled={savingTask}
                          className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40">
                          {savingTask ? t('workspace.saving', 'Saving…') : t('save', 'Save')}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {tasks.length === 0 ? (
                  <p className="text-white/30 text-sm py-10 text-center">{t('workspace.no_tasks', 'No tasks yet')}</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(tk => (
                      <div key={tk.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <button onClick={() => setTaskStatus(tk, tk.status === 'done' ? 'todo' : 'done')}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 text-[11px] ${
                            tk.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/25 hover:border-emerald-400'
                          }`}>
                          {tk.status === 'done' ? '✓' : ''}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${tk.status === 'done' ? 'text-white/35 line-through' : 'text-white/85'}`}>
                            {tk.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLE[tk.status]}`}>
                              {tk.status_display}
                            </span>
                            <span className="text-[10px] text-white/30">👤 {tk.assigned_to_name}</span>
                            {tk.email_subject && (
                              <span className="text-[10px] text-white/30 truncate max-w-[180px]" title={tk.email_subject}>
                                ✉️ {tk.email_subject}
                              </span>
                            )}
                            {tk.due_date && (
                              <span className={`text-[10px] ${tk.is_overdue ? 'text-red-300' : 'text-white/30'}`}>
                                📅 {new Date(tk.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {tk.status === 'returned' && tk.review_notes && (
                            <p className="text-[11px] text-amber-300/90 mt-1">↩ {tk.review_notes}</p>
                          )}
                        </div>
                        {tk.status === 'submitted' && (tk.assigned_by === user?.id || canDelegate) ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => reviewTask(tk, true)}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-400 whitespace-nowrap">
                              ✓ {t('workspace.approve', 'Approve')}
                            </button>
                            <button onClick={() => reviewTask(tk, false)}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 whitespace-nowrap">
                              ↩ {t('workspace.return_task', 'Return')}
                            </button>
                          </div>
                        ) : tk.status !== 'done' && tk.status !== 'submitted' && tk.assigned_to === user?.id ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => setTaskStatus(tk, tk.status === 'in_progress' ? 'todo' : 'in_progress')}
                              className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/10">
                              {tk.status === 'in_progress' ? '⏸' : '▶'}
                            </button>
                            <button onClick={() => submitTask(tk)}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-400 whitespace-nowrap">
                              {t('workspace.submit_review', 'Submit for review')}
                            </button>
                          </div>
                        ) : tk.status !== 'done' && (
                          <button onClick={() => setTaskStatus(tk, tk.status === 'in_progress' ? 'todo' : 'in_progress')}
                            className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/10 whitespace-nowrap">
                            {tk.status === 'in_progress' ? '⏸' : '▶'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------- CALENDAR ---------- */}
            {section === 'calendar' && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">
                    {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex gap-1">
                    <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-sm">‹</button>
                    <button onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-xs">{t('workspace.today', 'Today')}</button>
                    <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-sm">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-white/30 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: calendar.startPad }).map((_, i) => <div key={`pad${i}`} />)}
                  {Array.from({ length: calendar.days }).map((_, i) => {
                    const day = i + 1
                    const evts = calendar.events[day] || []
                    const isToday = new Date().toDateString() === new Date(month.getFullYear(), month.getMonth(), day).toDateString()
                    const picked = dayPanel && dayPanel.date.getDate() === day
                      && dayPanel.date.getMonth() === month.getMonth()
                    return (
                      /* Clicking a day is how an appointment gets made — the
                         calendar used to be read-only. */
                      <button key={day} onClick={() => openDay(day)}
                        title={t('workspace.add_on_day', 'Open this day')}
                        className={`min-h-[74px] w-full rounded-lg p-1.5 border text-left transition-colors hover:border-emerald-400/40 ${
                          picked ? 'border-emerald-400 bg-emerald-500/15'
                            : isToday ? 'border-emerald-400/50 bg-emerald-500/10'
                            : 'border-white/[0.06] bg-white/[0.02]'
                        }`}>
                        <div className={`text-[11px] font-bold ${isToday ? 'text-emerald-300' : 'text-white/50'}`}>{day}</div>
                        {evts.slice(0, 2).map((e, idx) => (
                          <div key={idx} className={`mt-0.5 text-[9px] px-1 py-0.5 rounded truncate ${
                            e.kind === 'task' ? 'bg-amber-500/20 text-amber-200'
                              : e.kind === 'booking' ? 'bg-blue-500/20 text-blue-200'
                              : e.kind === 'event' ? 'bg-purple-500/25 text-purple-200'
                              : 'bg-emerald-500/20 text-emerald-200'
                          }`}>{e.label}</div>
                        ))}
                        {evts.length > 2 && <div className="text-[9px] text-white/30 mt-0.5">+{evts.length - 2}</div>}
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-white/40">
                  <span>🟪 {t('workspace.appointments', 'Appointments')}</span>
                  <span>🟨 {t('workspace.tasks', 'Tasks')}</span>
                  <span>🟦 {t('workspace.bookings', 'Bookings')}</span>
                  <span>🟩 {t('workspace.jobs', 'Client jobs')}</span>
                </div>

                {/* ---------- the day you clicked ---------- */}
                {dayPanel && (
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-bold text-white">
                        {dayPanel.date.toLocaleDateString([], {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </h3>
                      <div className="flex gap-2">
                        {!dayPanel.form && (
                          <button onClick={startEvent}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400">
                            ➕ {t('workspace.add_appointment', 'Add appointment')}
                          </button>
                        )}
                        <button onClick={() => setDayPanel(null)}
                          className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/60 hover:text-white text-sm">✕</button>
                      </div>
                    </div>

                    {dayPanel.form ? (
                      <form onSubmit={saveEvent} className="space-y-2">
                        <input autoFocus value={dayPanel.form.title}
                          onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, title: e.target.value } }))}
                          placeholder={t('workspace.event_title', 'What is the appointment?')}
                          className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
                        <div className="flex flex-wrap gap-2">
                          <input type="time" value={dayPanel.form.time}
                            onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, time: e.target.value } }))}
                            className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm"
                            style={{ colorScheme: 'dark' }} />
                          <select value={dayPanel.form.duration}
                            onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, duration: e.target.value } }))}
                            className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm">
                            {[30, 60, 90, 120, 240].map(m => (
                              <option key={m} value={m} style={{ backgroundColor: '#0d3320', color: '#fff' }}>
                                {m} {t('workspace.minutes', 'min')}
                              </option>
                            ))}
                          </select>
                          <select value={dayPanel.form.kind}
                            onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, kind: e.target.value } }))}
                            className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm">
                            {[
                              ['appointment', t('workspace.k_appointment', 'Appointment')],
                              ['meeting', t('workspace.k_meeting', 'Meeting')],
                              ['deadline', t('workspace.k_deadline', 'Deadline')],
                              ['reminder', t('workspace.k_reminder', 'Reminder')],
                            ].map(([v, l]) => (
                              <option key={v} value={v} style={{ backgroundColor: '#0d3320', color: '#fff' }}>{l}</option>
                            ))}
                          </select>
                          {/* How long before it starts everyone gets told. */}
                          <select value={dayPanel.form.remind_minutes}
                            onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, remind_minutes: e.target.value } }))}
                            className="px-3 py-2 glass text-white rounded-lg border-0 outline-none text-sm">
                            {[
                              [0, t('workspace.no_reminder', 'No reminder')],
                              [15, `15 ${t('workspace.min_before', 'min before')}`],
                              [30, `30 ${t('workspace.min_before', 'min before')}`],
                              [60, `1 ${t('workspace.hour_before', 'hour before')}`],
                              [1440, `1 ${t('workspace.day_before', 'day before')}`],
                            ].map(([v, l]) => (
                              <option key={v} value={v} style={{ backgroundColor: '#0d3320', color: '#fff' }}>{l}</option>
                            ))}
                          </select>
                        </div>
                        <input value={dayPanel.form.location}
                          onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, location: e.target.value } }))}
                          placeholder={t('workspace.event_location', 'Where? (optional)')}
                          className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-sm" />
                        <div>
                          <p className="text-[11px] text-white/40 mb-1">
                            {t('workspace.event_with', 'With (optional)')}
                          </p>

                          {/* already chosen */}
                          {dayPanel.form.attendees.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {dayPanel.form.attendees.map(id => {
                                const person = [...people, ...(searchHits || [])].find(p => p.id === id)
                                return (
                                  <button type="button" key={id}
                                    onClick={() => setDayPanel(p => ({
                                      ...p,
                                      form: { ...p.form, attendees: p.form.attendees.filter(x => x !== id) },
                                    }))}
                                    className="px-2.5 py-1 rounded-full text-[11px] bg-emerald-500 text-white">
                                    {person?.full_name || `#${id}`} ✕
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Typing looks through every account, clients
                              included — an appointment is as often with a
                              client as with a colleague. */}
                          <input value={guestSearch} onChange={e => setGuestSearch(e.target.value)}
                            placeholder={t('workspace.search_people', 'Search staff or client by name or email…')}
                            className="w-full px-3 py-2 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-xs mb-1.5" />

                          <div className="flex flex-wrap gap-1.5">
                            {(searchHits === null ? people : searchHits)
                              .filter(u => !dayPanel.form.attendees.includes(u.id))
                              .slice(0, 12)
                              .map(u => (
                                <button type="button" key={u.id}
                                  title={u.email || ''}
                                  onClick={() => setDayPanel(p => ({
                                    ...p,
                                    form: { ...p.form, attendees: [...p.form.attendees, u.id] },
                                  }))}
                                  className="px-2.5 py-1 rounded-full text-[11px] bg-white/[0.06] text-white/60 hover:bg-white/[0.12]">
                                  {u.full_name}
                                  {u.is_staff_member === false && (
                                    <span className="ml-1 text-[9px] text-emerald-300/70">
                                      {t('workspace.client_tag', 'client')}
                                    </span>
                                  )}
                                </button>
                              ))}
                            {searchHits !== null && searchHits.length === 0 && (
                              <span className="text-[11px] text-white/30">
                                {t('workspace.no_match', 'Nobody with an account matches — write the name below instead.')}
                              </span>
                            )}
                          </div>

                          {/* Most clients have no account at all. */}
                          <input value={dayPanel.form.guests}
                            onChange={e => setDayPanel(p => ({ ...p, form: { ...p.form, guests: e.target.value } }))}
                            placeholder={t('workspace.guests', 'Anyone without an account (e.g. Mr Kileo, TANESCO)')}
                            className="w-full mt-1.5 px-3 py-2 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-xs" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setDayPanel(p => ({ ...p, form: null }))}
                            className="px-3 py-2 rounded-lg bg-white/[0.06] text-white/70 text-sm">
                            {t('cancel', 'Cancel')}
                          </button>
                          <button type="submit" disabled={savingEvent}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40">
                            {savingEvent ? t('workspace.saving', 'Saving…') : t('save', 'Save')}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-1.5">
                        {(calendar.events[dayPanel.date.getDate()] || []).length === 0 ? (
                          <p className="text-white/30 text-xs py-3 text-center">
                            {t('workspace.nothing_on_day', 'Nothing on this day yet')}
                          </p>
                        ) : (
                          (calendar.events[dayPanel.date.getDate()] || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                              <span className="text-xs">
                                {item.kind === 'event' ? '📌' : item.kind === 'task' ? '✅'
                                  : item.kind === 'booking' ? '📘' : '📗'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-white/85 truncate">{item.label}</p>
                                {item.event?.location && (
                                  <p className="text-[10px] text-white/35 truncate">📍 {item.event.location}</p>
                                )}
                                {(item.event?.attendee_names?.length > 0 || item.event?.guests) && (
                                  <p className="text-[10px] text-white/35 truncate">
                                    👥 {[...(item.event.attendee_names || []), item.event.guests]
                                      .filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </div>
                              {item.event && String(item.event.owner) === String(user?.id) && (
                                <button onClick={() => deleteEvent(item.event)}
                                  className="text-white/30 hover:text-red-300 text-xs px-1">✕</button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------- NOTES ---------- */}
            <CalculatorPopup open={calcOpen} onClose={() => setCalcOpen(false)} />

            {section === 'notes' && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white">{t('workspace.notes', 'Sticky notes')}</h2>
                  <button onClick={addNote} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400">
                    ➕ {t('workspace.add_note', 'Add note')}
                  </button>
                </div>
                {notes.length === 0 ? (
                  <p className="text-white/30 text-sm py-10 text-center">{t('workspace.no_notes', 'No notes yet')}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {notes.map(n => (
                      <div key={n.id} className={`rounded-xl border p-3 ${NOTE_COLORS[n.color] || NOTE_COLORS.yellow}`}>
                        <textarea defaultValue={n.content} rows="6"
                          onBlur={e => saveNote(n, e.target.value)}
                          placeholder={t('workspace.note_placeholder', 'Write something…')}
                          className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/30 outline-none resize-none" />
                        <div className="flex justify-between items-center pt-1 border-t border-white/10">
                          <span className="text-[10px] text-white/30">
                            {new Date(n.updated_at).toLocaleDateString()}
                          </span>
                          <button onClick={() => deleteNote(n)} className="text-[11px] text-white/35 hover:text-red-300">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------- DRAFTS (quick doc / sheet) ---------- */}
            {section === 'finance' && canFinance && <FinancePanel />}

            {section === 'drafts' && <DraftTools />}

            {/* ---------- CALCULATOR ---------- */}


            {/* ---------- DOCUMENTS ---------- */}
            {section === 'files' && (
              <div className="glass-card p-5">
                <h2 className="text-base font-bold text-white mb-1">{t('workspace.documents', 'Documents')}</h2>
                <p className="text-white/40 text-sm mb-4">
                  {t('workspace.documents_hint', 'Work on files in Word or Excel, then upload the finished version to the job so the client can download it.')}
                </p>
                {jobs.length === 0 ? (
                  <p className="text-white/30 text-sm py-8 text-center">
                    {t('workspace.no_jobs', 'No jobs assigned to you yet')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {jobs.map(j => (
                      <div key={j.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-white/85 truncate">{j.item_name || j.service_name}</p>
                            <p className="text-[11px] text-white/35">{j.client_name || j.client_email}</p>
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60 whitespace-nowrap">
                            {(j.documents || []).length} {t('workspace.files', 'files')}
                          </span>
                        </div>
                        {(j.documents || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {j.documents.map(d => (
                              <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer"
                                className="text-[11px] text-emerald-300 hover:text-emerald-200 underline truncate max-w-[220px]">
                                📎 {d.title}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <label className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            uploadingTo === j.id ? 'bg-white/[0.06] text-white/40'
                              : 'bg-emerald-500 text-white hover:bg-emerald-400'
                          }`}>
                            {uploadingTo === j.id
                              ? t('workspace.uploading', 'Uploading…')
                              : `⬆ ${t('workspace.upload_file', 'Upload a file')}`}
                            <input type="file" className="hidden" disabled={uploadingTo === j.id}
                              onChange={e => {
                                const file = e.target.files?.[0]
                                e.target.value = ''       // same file twice should still work
                                uploadDeliverable(j, file, true)
                              }} />
                          </label>
                          <span className="text-[10px] text-white/30">
                            {t('workspace.upload_client_note', 'Uploaded files are visible to the client')}
                          </span>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-white/30 pt-2">
                      {t('workspace.documents_note', 'These are the files attached to your client jobs. Quick drafts you write here live under Drafts, and can be downloaded to finish in Word or Excel.')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ---------- REPORTS ---------- */}
            {section === 'reports' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Stat icon="✅" label={t('workspace.tasks_done', 'Tasks completed')} value={myTasks.filter(x => x.status === 'done').length} />
                  <Stat icon="🕓" label={t('workspace.tasks_open', 'Tasks open')} value={openTasks.length} tone="amber" />
                  <Stat icon="🗂️" label={t('workspace.jobs_assigned', 'Jobs assigned')} value={jobs.length} tone="blue" />
                  <Stat icon="📅" label={t('workspace.bookings', 'Bookings')} value={bookings.length} tone="purple" />
                </div>
                <div className="glass-card p-5">
                  <h2 className="text-sm font-bold text-white mb-3">{t('workspace.jobs_by_status', 'My jobs by stage')}</h2>
                  {['pending', 'confirmed', 'in_progress', 'completed', 'delivered'].map(s => {
                    const n = jobs.filter(j => j.status === s).length
                    const pct = jobs.length ? Math.round((n / jobs.length) * 100) : 0
                    return (
                      <div key={s} className="mb-2.5">
                        <div className="flex justify-between text-[11px] text-white/50 mb-1">
                          <span className="capitalize">{s.replace('_', ' ')}</span><span>{n}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-green-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {jobs.length === 0 && <p className="text-white/30 text-sm py-4 text-center">{t('workspace.no_jobs', 'No jobs yet')}</p>}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default WorkspacePage
