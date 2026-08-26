// src/features/accounts/pages/WorkPage.jsx
//
// One page for one piece of work — a client job or an internal task.
//
// Before this, work was handed out and then vanished: a task was a single row
// with no way to read its description or open its attachment, and a job had a
// client-facing summary card with no brief, no files and no actions. People
// were told to do work they could not open.
//
// The shape is the same for both, because the questions are the same: what am
// I doing, what was I given, what has happened so far, what have I produced,
// and what is the next step. Only the last section differs by role.

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'
import { useAuth } from '../hooks/useAuth'
import useAutoRefresh from '../../../app/useAutoRefresh'
import openFile, { fileError } from '../../../app/openFile'
import FieldSheets from '../components/workspace/FieldSheets'

const STATUS_STYLE = {
  pending:     'bg-white/10 text-white/70',
  todo:        'bg-white/10 text-white/70',
  confirmed:   'bg-sky-500/20 text-sky-300',
  in_progress: 'bg-amber-500/20 text-amber-300',
  submitted:   'bg-purple-500/20 text-purple-200',
  returned:    'bg-red-500/20 text-red-300',
  completed:   'bg-emerald-500/20 text-emerald-300',
  done:        'bg-emerald-500/20 text-emerald-300',
  delivered:   'bg-emerald-500/30 text-emerald-200',
  cancelled:   'bg-red-500/15 text-red-300',
}

const WorkPage = () => {
  const { kind, id } = useParams()           // kind: 'job' | 'task'
  const isJob = kind === 'job'
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const navigate = useNavigate()
  const refresh = useAutoRefresh()

  const [item, setItem] = useState(null)
  const [notes, setNotes] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const endpoint = isJob ? `/consultation-requests/${id}/` : `/tasks/${id}/`

  const load = useCallback(async () => {
    try {
      const [itemRes, noteRes] = await Promise.all([
        api.get(endpoint),
        api.get(`/work-notes/?${isJob ? 'job' : 'task'}=${id}&page_size=100`)
          .catch(() => ({ data: [] })),
      ])
      setItem(itemRes.data)
      setNotes(noteRes.data?.results || noteRes.data || [])
      if (isJob) {
        const d = await api.get(`/consultation-documents/?request=${id}&page_size=50`)
          .catch(() => ({ data: [] }))
        setDocs(d.data?.results || d.data || [])
      }
    } catch (e) {
      console.error('work item load failed', e)
    } finally {
      setLoading(false)
    }
  }, [endpoint, id, isJob])

  useEffect(() => { load() }, [load, refresh])

  const canDelegate = (() => {
    const role = (user?.role_name || user?.role?.name || '').toLowerCase()
    return role === 'admin' || role === 'consultant' || user?.is_superuser
  })()
  const isMine = item && String(item.assigned_to) === String(user?.id)

  const act = async (path, body = {}) => {
    setBusy(true)
    try {
      const base = isJob ? `/consultation-requests/${id}/` : `/tasks/${id}/`
      const res = await api.post(`${base}${path}/`, body)
      setItem(res.data)
      await load()
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail
        || t('work.action_failed', 'That did not work'))
    } finally {
      setBusy(false)
    }
  }

  const addNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    try {
      await api.post('/work-notes/', {
        [isJob ? 'job' : 'task']: id, body: noteText.trim(), is_internal: true,
      })
      setNoteText('')
      await load()
    } catch (err) {
      alert(t('work.note_failed', 'Could not save the note'))
    }
  }

  const uploadResult = async (file) => {
    if (!file || !isJob) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('request', id)
      fd.append('file', file)
      fd.append('title', file.name)
      // Internal until someone sends it: the client sees a document when it
      // is emailed to them, not because it was uploaded here.
      fd.append('is_deliverable', 'false')
      await api.post('/consultation-documents/', fd,
        { headers: { 'Content-Type': 'multipart/form-data' } })
      await load()
    } catch (err) {
      alert(err.response?.data?.detail || t('work.upload_failed', 'Could not upload it'))
    } finally {
      setUploading(false)
    }
  }

  // Keeping it as a draft rather than a download: the report gets finished
  // here, shared with whoever is reviewing it, and only then goes to Word.
  const makeDraft = async () => {
    setBusy(true)
    try {
      const res = await api.post(`/consultation-requests/${id}/report/`)
      const used = res.data?.sheets_used ?? 0
      alert(used === 0
        ? t('report.empty', 'A draft was created, but there is no field data in it yet.')
        : t('report.made', 'Draft created from {{n}} field sheet(s). Find it under Drafts.')
          .replace('{{n}}', used))
      navigate('/workspace')
    } catch (err) {
      alert(err.response?.data?.error || t('report.failed', 'Could not build the report'))
    } finally {
      setBusy(false)
    }
  }

  // Every file here is behind the API's bearer token, which a plain link
  // does not carry — see app/openFile.js.
  const open = (path, download = '') => openFile(path, { download })
    .catch(async err => alert(
      `${t('work.open_failed', 'Could not open the file')}: ${await fileError(err)}`))

  const setProgress = async (value) => {
    if (!isJob) return
    try {
      const res = await api.post(`/consultation-requests/${id}/progress/`, { progress: value })
      setItem(res.data)
    } catch (err) { console.error(err) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-white/50">{t('work.not_found', 'This work item could not be opened')}</p>
        <Link to="/workspace" className="text-emerald-300 underline">
          {t('work.back', 'Back to workspace')}
        </Link>
      </div>
    )
  }

  // What the client sent us versus what we produced. The deliverable flag
  // answers a different question — "has it been released" — and using it here
  // filed your own upload under "what you were given".
  const fromClient = d => !d.uploaded_by || String(d.uploaded_by) === String(item?.client)
  const givenDocs = docs.filter(fromClient)
  const producedDocs = docs.filter(d => !fromClient(d))

  const title = isJob
    ? (item.item_name || item.category_name || item.service_name || t('work.a_job', 'Consultation'))
    : item.title
  const brief = isJob ? item.message : item.description
  const progress = isJob ? (item.progress || 0) : null

  return (
    <div className="min-h-screen py-5 md:py-8">
      <div className="container-main max-w-4xl space-y-4">

        <Link to="/workspace" className="text-sm text-white/50 hover:text-emerald-300">
          ‹ {t('work.back', 'Back to workspace')}
        </Link>

        {/* ---------- what this is ---------- */}
        <div className="glass-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold text-white">{title}</h1>
              <p className="text-white/45 text-sm mt-1">
                {isJob ? (
                  <>👤 {item.client_name || item.client_email}
                    {item.preferred_date && ` · 📅 ${new Date(item.preferred_date).toLocaleDateString()}`}
                    {item.budget_range && ` · 💰 ${item.budget_range}`}</>
                ) : (
                  <>👤 {item.assigned_to_name}
                    {item.due_date && ` · 📅 ${new Date(item.due_date).toLocaleDateString()}`}
                    {item.priority_display && ` · ${item.priority_display}`}</>
                )}
              </p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${STATUS_STYLE[item.status] || 'bg-white/10 text-white/60'}`}>
              {item.status_display || item.status}
            </span>
          </div>

          {isJob && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-white/45 mb-1">
                <span>{t('work.progress', 'Progress')}</span>
                <span className="font-bold text-emerald-300">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              {(isMine || canDelegate) && (
                <div className="flex gap-1.5 mt-2">
                  {[0, 25, 50, 75, 100].map(v => (
                    <button key={v} onClick={() => setProgress(v)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                        progress === v ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-white/50 hover:bg-white/10'
                      }`}>{v}%</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {item.assigned_to_name && isJob && (
            <p className="text-[11px] text-white/40 mt-3">
              {t('work.doing_it', 'Doing the work')}: <b className="text-white/70">{item.assigned_to_name}</b>
            </p>
          )}
        </div>

        {/* ---------- 1. the brief ---------- */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-2">
            📋 {t('work.brief', 'What needs doing')}
          </h2>
          {brief ? (
            <p className="text-white/75 text-sm whitespace-pre-wrap leading-relaxed">{brief}</p>
          ) : (
            <p className="text-white/30 text-sm">{t('work.no_brief', 'No description was given')}</p>
          )}
          {item.review_notes && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-[11px] font-bold text-red-300 mb-1">
                {t('work.returned_because', 'Sent back for changes')}
              </p>
              <p className="text-sm text-white/80">{item.review_notes}</p>
            </div>
          )}
        </div>

        {/* ---------- 2. what you were given ---------- */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-2">
            📎 {t('work.given', 'What you were given')}
          </h2>
          <div className="space-y-1.5">
            {!isJob && item.attachment_url && (
              <button type="button" onClick={() => open(`/files/task-attachment/${item.id}/`)}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07]">
                <span>📄</span>
                <span className="text-sm text-emerald-300 underline truncate">
                  {t('work.the_attachment', 'Open the attached file')}
                </span>
              </button>
            )}
            {!isJob && item.related_email && (
              <div className="p-2.5 rounded-lg bg-white/[0.03]">
                <p className="text-[11px] text-white/40">{t('work.from_email', 'From this email')}</p>
                <p className="text-sm text-white/80 truncate">✉️ {item.email_subject}</p>
                <p className="text-[11px] text-white/40 truncate">{item.email_sender}</p>
                <Link to="/email-inbox" className="text-[11px] text-emerald-300 underline">
                  {t('work.open_inbox', 'Open in the inbox')}
                </Link>
              </div>
            )}
            {isJob && givenDocs.map(d => (
              <button type="button" key={d.id} onClick={() => open(`/files/document/${d.id}/`)}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07]">
                <span>📄</span>
                <span className="text-sm text-emerald-300 underline truncate">{d.title}</span>
                <span className="text-[10px] text-white/30 ml-auto">{d.file_size_display}</span>
              </button>
            ))}
            {((!isJob && !item.attachment_url && !item.related_email)
              || (isJob && givenDocs.length === 0)) && (
              <p className="text-white/30 text-sm">{t('work.nothing_given', 'Nothing was attached')}</p>
            )}
          </div>
        </div>

        {/* ---------- 3. field data (the tools) ---------- */}
        <FieldSheets kind={kind} id={id} />

        {/* ---------- the draft that writes itself ---------- */}
        {isJob && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-white mb-1">
              📝 {t('report.title', 'Draft report')}
            </h2>
            <p className="text-[11px] text-white/40 mb-3">
              {t('report.hint', 'Builds the tables, the averages and the findings straight from the field data. The judgement and recommendations are yours to write.')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button"
                onClick={() => open(`/consultation-requests/${id}/report/`,
                  `${title || 'report'}.doc`)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400">
                ⬇ {t('report.download', 'Download as Word')}
              </button>
              <button onClick={makeDraft} disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white/75 text-sm font-semibold hover:bg-white/10 disabled:opacity-40">
                ✍️ {t('report.to_drafts', 'Open as a draft to edit')}
              </button>
            </div>
          </div>
        )}

        {/* ---------- 4. what has happened ---------- */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-3">
            💬 {t('work.activity', 'Notes and progress')}
          </h2>
          <div className="space-y-2 mb-3">
            {notes.length === 0 ? (
              <p className="text-white/30 text-sm">
                {t('work.no_notes', 'Nothing noted yet — say where things stand so the next person knows')}
              </p>
            ) : notes.map(n => (
              <div key={n.id} className="p-2.5 rounded-lg bg-white/[0.03]">
                <p className="text-sm text-white/80 whitespace-pre-wrap">{n.body}</p>
                <p className="text-[10px] text-white/35 mt-1">
                  {n.author_name} · {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={addNote} className="flex gap-2">
            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder={t('work.add_note', 'Add a note — site visit done, waiting on the lab…')}
              className="flex-1 px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-sm" />
            <button type="submit" disabled={!noteText.trim()}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40">
              {t('work.post', 'Add')}
            </button>
          </form>
        </div>

        {/* ---------- 5. what you produced ---------- */}
        {isJob && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-white mb-1">
              📤 {t('work.results', 'The finished work')}
            </h2>
            <p className="text-[11px] text-white/40 mb-3">
              {t('work.results_hint', 'Uploaded files stay internal. The client sees a file when it is emailed to them.')}
            </p>
            <div className="space-y-1.5 mb-3">
              {producedDocs.length === 0 ? (
                <p className="text-white/30 text-sm">{t('work.no_results', 'Nothing uploaded yet')}</p>
              ) : producedDocs.map(d => (
                <button type="button" key={d.id} onClick={() => open(`/files/document/${d.id}/`)}
                  className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15">
                  <span>📦</span>
                  <span className="text-sm text-emerald-200 underline truncate">{d.title}</span>
                  <span className="ml-auto text-[10px] flex-shrink-0">
                    {d.is_deliverable
                      ? <span className="text-emerald-300">✓ {t('work.client_has_it', 'sent to client')}</span>
                      : <span className="text-white/35">🔒 {t('work.internal_only', 'internal')}</span>}
                  </span>
                </button>
              ))}
            </div>
            <label className="inline-block px-3.5 py-2 rounded-lg bg-white/[0.06] text-white/75 text-xs font-semibold hover:bg-white/10 cursor-pointer">
              {uploading ? t('work.uploading', 'Uploading…') : `⬆ ${t('work.upload', 'Upload finished work')}`}
              <input type="file" className="hidden" disabled={uploading}
                onChange={e => { uploadResult(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          </div>
        )}

        {/* ---------- 6. the next step ---------- */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-white mb-3">
            ▶️ {t('work.next_step', 'Next step')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {/* the person doing it */}
            {isMine && ['pending', 'confirmed', 'todo', 'returned'].includes(item.status) && (
              <button onClick={() => act(isJob ? 'update_status' : 'update_status',
                isJob ? { status: 'in_progress' } : {})}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40">
                {t('work.start', 'Start work')}
              </button>
            )}
            {isMine && ['in_progress', 'returned'].includes(item.status) && (
              <button onClick={() => act('submit')} disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold disabled:opacity-40">
                {t('work.submit', 'Finished — send for review')}
              </button>
            )}

            {/* the person checking it */}
            {canDelegate && item.status === 'submitted' && (
              <>
                <button onClick={() => act('review', { approve: true })} disabled={busy}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-40">
                  ✓ {t('work.approve', 'Approve')}
                </button>
                <button
                  onClick={() => {
                    const why = window.prompt(t('work.what_is_missing', 'What still needs doing?'))
                    if (why && why.trim()) act('review', { approve: false, notes: why.trim() })
                  }}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white/75 text-sm font-semibold">
                  ↩ {t('work.return', 'Send back')}
                </button>
              </>
            )}

            {/* sending it out */}
            {isJob && canDelegate && ['completed', 'submitted'].includes(item.status) && (
              <button
                onClick={() => {
                  const ids = producedDocs.map(d => d.id)
                  act('deliver', { document_ids: ids })
                }}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold disabled:opacity-40">
                📨 {t('work.deliver', 'Send to the client')}
              </button>
            )}

            {item.status === 'delivered' && (
              <p className="text-sm text-emerald-300">
                ✓ {t('work.all_done', 'Delivered to the client')}
                {item.response_sent_at && ` · ${new Date(item.response_sent_at).toLocaleDateString()}`}
              </p>
            )}
            {!isMine && !canDelegate && (
              <p className="text-sm text-white/40">
                {t('work.not_yours', 'This is not assigned to you')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkPage
