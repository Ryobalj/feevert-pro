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
import Calculator from '../components/workspace/Calculator'

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

  useEffect(() => { load() }, [load])

  const myTasks = useMemo(
    () => tasks.filter(t => String(t.assigned_to) === String(user?.id)),
    [tasks, user]
  )
  const openTasks = myTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  const overdue = myTasks.filter(t => t.is_overdue)

  // ---- task actions
  const saveTask = async (e) => {
    e.preventDefault()
    if (!newTask?.title?.trim()) return
    try {
      await api.post('/tasks/', {
        title: newTask.title.trim(),
        description: newTask.description || '',
        assigned_to: newTask.assigned_to || user?.id,
        priority: newTask.priority || 'medium',
        due_date: newTask.due_date || null,
      })
      setNewTask(null)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not save the task')
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
    return { startPad, days, events }
  }, [month, bookings, jobs, myTasks])

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
            {SECTIONS.filter(s => !s.financeOnly || canFinance).map(s => (
              <button key={s.key} onClick={() => setSection(s.key)}
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
                <button onClick={() => { setSection('tasks'); setNewTask({ title: '', assigned_to: user?.id, priority: 'medium' }) }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold">
                  ➕ {t('workspace.new_task', 'New task')}
                </button>
              </div>
            </div>

            {/* mobile section tabs */}
            <div className="md:hidden flex gap-1 overflow-x-auto pb-3 mb-2">
              {SECTIONS.filter(s => !s.financeOnly || canFinance).map(s => (
                <button key={s.key} onClick={() => setSection(s.key)}
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
                  <h2 className="text-base font-bold text-white">{t('workspace.tasks', 'Tasks')}</h2>
                  <button onClick={() => setNewTask({ title: '', assigned_to: user?.id, priority: 'medium' })}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400">
                    ➕ {t('workspace.new_task', 'New task')}
                  </button>
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
                      <div className="ml-auto flex gap-2">
                        <button type="button" onClick={() => setNewTask(null)}
                          className="px-3 py-2 rounded-lg bg-white/[0.06] text-white/70 text-sm">{t('cancel', 'Cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold">
                          {t('save', 'Save')}
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
                    return (
                      <div key={day} className={`min-h-[74px] rounded-lg p-1.5 border text-left ${
                        isToday ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-white/[0.06] bg-white/[0.02]'
                      }`}>
                        <div className={`text-[11px] font-bold ${isToday ? 'text-emerald-300' : 'text-white/50'}`}>{day}</div>
                        {evts.slice(0, 2).map((e, idx) => (
                          <div key={idx} className={`mt-0.5 text-[9px] px-1 py-0.5 rounded truncate ${
                            e.kind === 'task' ? 'bg-amber-500/20 text-amber-200'
                              : e.kind === 'booking' ? 'bg-blue-500/20 text-blue-200'
                              : 'bg-emerald-500/20 text-emerald-200'
                          }`}>{e.label}</div>
                        ))}
                        {evts.length > 2 && <div className="text-[9px] text-white/30 mt-0.5">+{evts.length - 2}</div>}
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-3 mt-3 text-[10px] text-white/40">
                  <span>🟨 {t('workspace.tasks', 'Tasks')}</span>
                  <span>🟦 {t('workspace.bookings', 'Bookings')}</span>
                  <span>🟩 {t('workspace.jobs', 'Client jobs')}</span>
                </div>
              </div>
            )}

            {/* ---------- NOTES ---------- */}
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
            {section === 'calc' && (
              <div className="flex flex-wrap gap-4">
                <Calculator />
                <div className="glass-card p-5 flex-1 min-w-[240px]">
                  <h2 className="text-sm font-bold text-white mb-2">Quick reference</h2>
                  <p className="text-white/45 text-xs leading-relaxed">
                    Type with the keyboard too: numbers, + − * /, Enter to total,
                    Backspace to undo, Esc to clear. Results are kept in the
                    history below the keypad.
                  </p>
                </div>
              </div>
            )}

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
                      </div>
                    ))}
                    <p className="text-[11px] text-white/30 pt-2">
                      {t('workspace.upload_hint', 'Upload deliverables from your dashboard job list (My Jobs).')}
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
