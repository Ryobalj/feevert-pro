// src/features/notifications/pages/EmailInboxPage.jsx
//
// Full mail client: folders + views on the left, a date-grouped message list in
// the middle, and the message with reply/forward on the right — plus the team
// bits a plain mail client doesn't have (assign, archive, snooze, shared
// mailboxes), so staff can work here instead of in Zoho.

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'
import useAutoRefresh from '../../../app/useAutoRefresh'

const FOLDERS = [
  { key: 'inbox',   label: 'Inbox',   icon: '📥' },
  { key: 'sent',    label: 'Sent',    icon: '📤' },
  { key: 'drafts',  label: 'Drafts',  icon: '📝' },
  { key: 'archive', label: 'Archive', icon: '🗄️' },
  { key: 'spam',    label: 'Spam',    icon: '⚠️' },
  { key: 'trash',   label: 'Trash',   icon: '🗑️' },
]

// Team views — who's on what, and what's already handled.
const TEAM_VIEWS = [
  { key: 'all',        label: 'All mail',      icon: '✉️' },
  { key: 'unread',     label: 'Unread',        icon: '🔵' },
  { key: 'unassigned', label: 'Unassigned',    icon: '🕓' },
  { key: 'mine',       label: 'Assigned to me', icon: '👤' },
  { key: 'archived',   label: 'Archived',      icon: '✅' },
]

const dayBucket = (iso) => {
  if (!iso) return 'Older'
  const d = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'Last 7 days'
  return 'Older'
}

const EmailInboxPage = () => {
  // Refetches when the tab comes back to the front, and on a slow timer —
  // otherwise a page left open keeps showing yesterday's content.
  const refresh = useAutoRefresh()
  const { t } = useTranslation('notifications')
  const [emails, setEmails] = useState([])
  const [mailboxes, setMailboxes] = useState([])
  const [counts, setCounts] = useState({ total: 0, unread: 0 })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [acting, setActing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [folder, setFolder] = useState('inbox')
  const [teamView, setTeamView] = useState('all')
  const [mailbox, setMailbox] = useState(null)
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true)
  const [compose, setCompose] = useState(null) // {to, subject, body, account}
  const [alias, setAlias] = useState(null)      // filter by the address mail was sent to
  const [aliases, setAliases] = useState([])
  const [contacts, setContacts] = useState(null) // null = mail view, array = address book
  const [folderCounts, setFolderCounts] = useState({})
  const [fromOptions, setFromOptions] = useState([])
  const [replyFrom, setReplyFrom] = useState('')
  const [replyFiles, setReplyFiles] = useState([])   // files going out with the reply
  const [replyDocs, setReplyDocs] = useState([])     // files already on a client job
  const [docPicker, setDocPicker] = useState(null)   // null = closed, '' or a search term
  const [docHits, setDocHits] = useState([])
  const [inbound, setInbound] = useState([])        // files attached to the open message
  const [inboundError, setInboundError] = useState('')
  const [taskForm, setTaskForm] = useState(null)   // {title, assigned_to, due_date}
  const [assignables, setAssignables] = useState([])
  const [picked, setPicked] = useState([])          // ids ticked for a bulk action
  const [outbox, setOutbox] = useState(null)        // null = mail view, array = delivery view

  const loadEmails = useCallback(async () => {
    setLoading(true)
    try {
      // The API paginates at 9 by default, which made a full mailbox look
      // nearly empty — ask for a mailbox-sized page instead.
      const p = new URLSearchParams({ page_size: '200' })
      if (mailbox) p.set('account', mailbox)
      if (search.trim()) p.set('search', search.trim())
      p.set('folder', folder)
      p.set('is_archived', teamView === 'archived' ? 'true' : 'false')
      if (teamView === 'unread') p.set('is_read', 'false')
      if (teamView === 'unassigned') p.set('assigned_to', 'none')
      if (teamView === 'mine') p.set('assigned_to', 'me')
      if (alias) p.set('to', alias)
      const res = await api.get(`/email-inbox/?${p.toString()}`)
      setEmails(res.data?.results || res.data || [])
    } catch (error) {
      console.error('Error loading mail:', error)
    } finally {
      setLoading(false)
    }
  }, [mailbox, search, folder, teamView, alias])

  const loadMailboxes = useCallback(async () => {
    try {
      const res = await api.get('/email-inbox/mailboxes/')
      setMailboxes(res.data?.mailboxes || [])
      setAliases(res.data?.aliases || [])
      setFolderCounts(res.data?.folders || {})
      setFromOptions(res.data?.from_options || [])
      setCounts({ total: res.data?.total || 0, unread: res.data?.unread || 0 })
    } catch (error) {
      console.error('Error loading mailboxes:', error)
    }
  }, [])

  useEffect(() => { loadEmails() }, [loadEmails, refresh])
  useEffect(() => { loadMailboxes() }, [loadMailboxes])

  // A tick belongs to the list it was made in — changing folder, mailbox or
  // view must not leave a selection pointing at messages nobody can see.
  useEffect(() => { setPicked([]) }, [folder, teamView, mailbox, alias, search])

  // Who this person may hand work to — empty for staff who can't delegate,
  // which is how the button knows to stay hidden.
  useEffect(() => {
    api.get('/tasks/assignable_users/')
      .then(res => setAssignables(res.data?.users || res.data || []))
      .catch(() => setAssignables([]))
  }, [])

  const grouped = useMemo(() => {
    const out = {}
    for (const e of emails) {
      const b = dayBucket(e.received_at)
      ;(out[b] = out[b] || []).push(e)
    }
    return ['Today', 'Yesterday', 'Last 7 days', 'Older']
      .filter(b => out[b]?.length)
      .map(b => [b, out[b]])
  }, [emails])

  // The address book is ~900 messages deep, so it has to be searchable —
  // reuse the same search box the mail list uses.
  const loadContacts = useCallback(async (term = '') => {
    try {
      const q = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''
      const res = await api.get(`/email-inbox/contacts/${q}`)
      setContacts(res.data?.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
      setContacts([])
    }
  }, [])

  // Typing in the search box while the address book is open re-queries it.
  useEffect(() => {
    if (contacts === null) return
    const id = setTimeout(() => loadContacts(search), 300)
    return () => clearTimeout(id)
  }, [search])

  // Files already held against a client job: sending one shouldn't mean
  // hunting for it on a laptop again.
  useEffect(() => {
    if (docPicker === null) return
    const term = docPicker.trim()
    const id = setTimeout(() => {
      api.get(`/consultation-documents/?page_size=20${term ? `&search=${encodeURIComponent(term)}` : ''}`)
        .then(res => setDocHits(res.data?.results || res.data || []))
        .catch(() => setDocHits([]))
    }, 250)
    return () => clearTimeout(id)
  }, [docPicker])

  const openEmail = async (email) => {
    setShowList(false)
    try {
      const res = await api.get(`/email-inbox/${email.id}/`)
      setSelected(res.data)
      setReplyText('')
      if (!email.is_read) {
        await api.post(`/email-inbox/${email.id}/mark_read/`)
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
        loadMailboxes()
      }
    } catch (error) {
      console.error('Error opening email:', error)
    }
  }

  // What came attached: asked for only when a message that has attachments is
  // opened, because the files live in Zoho, not here.
  useEffect(() => {
    setInbound([])
    setInboundError('')
    if (!selected?.has_attachments) return
    let cancelled = false
    api.get(`/email-inbox/${selected.id}/attachments/`)
      .then(res => { if (!cancelled) setInbound(res.data?.attachments || []) })
      .catch(err => {
        if (!cancelled) setInboundError(err.response?.data?.error
          || t('inbox.attachments_failed', 'Could not read the attachments'))
      })
    return () => { cancelled = true }
  }, [selected?.id, selected?.has_attachments])

  const runAction = async (email, path, body = {}) => {
    if (!email) return
    setActing(true)
    try {
      const res = await api.post(`/email-inbox/${email.id}/${path}/`, body)
      setSelected(prev => (prev && prev.id === email.id ? { ...prev, ...(res.data || {}) } : prev))
      await Promise.all([loadEmails(), loadMailboxes()])
    } catch (error) {
      console.error(`${path} failed:`, error)
      alert(error.response?.data?.error || `Could not ${path} this conversation`)
    } finally {
      setActing(false)
    }
  }

  // ---- ticking several messages at once ----------------------------------
  // Working through a folder one message at a time is what people were doing;
  // this is the "tick a few, or tick the lot" path.
  const togglePick = (id) => setPicked(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const allPicked = emails.length > 0 && picked.length === emails.length
  const togglePickAll = () => setPicked(allPicked ? [] : emails.map(e => e.id))

  const bulkAction = async (what) => {
    if (picked.length === 0) return
    setActing(true)
    try {
      await api.post('/email-inbox/bulk/', { action: what, ids: picked })
      setPicked([])
      await Promise.all([loadEmails(), loadMailboxes()])
    } catch (error) {
      alert(error.response?.data?.error || t('inbox.bulk_failed', 'Could not update those messages'))
    } finally {
      setActing(false)
    }
  }

  // ---- what happened to the mail we sent ---------------------------------
  const loadOutbox = useCallback(async () => {
    try {
      const res = await api.get('/sent-mail/?page_size=100')
      setOutbox(res.data?.results || res.data || [])
    } catch (error) {
      console.error('Error loading sent mail:', error)
      setOutbox([])
    }
  }, [])

  const retrySend = async (row) => {
    setActing(true)
    try {
      // Say what happened. A retry that fails for a new reason looked exactly
      // like one that failed for the old reason — silence either way.
      const res = await api.post(`/sent-mail/${row.id}/retry/`)
      await loadOutbox()
      if (res.data && res.data.success === false) {
        alert(`${t('inbox.retry_failed', 'Could not send it again')}:

${res.data.error || ''}`)
      }
    } catch (error) {
      alert(error.response?.data?.error || t('inbox.retry_failed', 'Could not send it again'))
    } finally {
      setActing(false)
    }
  }

  const assignToMe = (e) => runAction(e, 'assign')
  const unassign = (e) => runAction(e, 'assign', { user_id: null })
  const archive = (e, archived = true) => runAction(e, 'archive', { archived })
  const snooze = (e, hours) => runAction(e, 'snooze', { hours })
  const markUnread = async (e) => {
    await api.post(`/email-inbox/${e.id}/mark_unread/`).catch(console.error)
    setEmails(prev => prev.map(x => x.id === e.id ? { ...x, is_read: false } : x))
    loadMailboxes()
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.post('/email-inbox/sync_now/')
      await Promise.all([loadEmails(), loadMailboxes()])
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleReply = async (e, all = false) => {
    e.preventDefault()
    if (!replyText.trim() || !selected) return
    setSendingReply(true)
    try {
      // Files can't ride in JSON, so a reply carrying them goes as form data.
      // This is the only door a document leaves by: a file uploaded to a job
      // stays internal until someone sends it.
      let res
      if (replyFiles.length > 0 || replyDocs.length > 0) {
        const form = new FormData()
        form.append('body', replyText.trim())
        if (replyFrom) form.append('from_address', replyFrom)
        replyFiles.forEach(f => form.append('attachments', f))
        replyDocs.forEach(d => form.append('document_ids', d.id))
        res = await api.post(`/email-inbox/${selected.id}/reply/`, form,
          { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        res = await api.post(`/email-inbox/${selected.id}/reply/`, {
          body: replyText.trim(),
          ...(replyFrom ? { from_address: replyFrom } : {}),
        })
      }
      setSelected(prev => ({ ...prev, is_processed: true }))
      setReplyText('')
      setReplyFiles([])
      setReplyDocs([])
      setDocPicker(null)
      // A refused message is no longer lost — say so plainly instead of
      // reporting a success the recipient never saw.
      if (res.data && res.data.success === false) {
        alert(`${t('inbox.queued_notice', 'The mail server refused it for now — it will be retried automatically. Track it under Delivery.')}\n\n${res.data.error || ''}`)
      }
      if (outbox !== null) loadOutbox()
    } catch (error) {
      alert(error.response?.data?.error || t('inbox.reply_failed', 'Failed to send reply'))
    } finally {
      setSendingReply(false)
    }
  }

  const sendCompose = async (e) => {
    e.preventDefault()
    if (!compose?.to?.trim()) return
    setSendingReply(true)
    try {
      let res
      if ((compose.files || []).length > 0) {
        const form = new FormData()
        form.append('to', compose.to.trim())
        form.append('subject', compose.subject || '')
        form.append('body', compose.body || '')
        const acct = compose.account || mailbox
        if (acct) form.append('account', acct)
        compose.files.forEach(f => form.append('attachments', f))
        res = await api.post('/email-inbox/compose/', form,
          { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        res = await api.post('/email-inbox/compose/', {
          to: compose.to.trim(),
          subject: compose.subject || '',
          body: compose.body || '',
          account: compose.account || mailbox || undefined,
        })
      }
      setCompose(null)
      if (res.data && res.data.success === false) {
        alert(`${t('inbox.queued_notice', 'The mail server refused it for now — it will be retried automatically. Track it under Delivery.')}\n\n${res.data.error || ''}`)
      }
      if (outbox !== null) loadOutbox()
    } catch (error) {
      alert(error.response?.data?.error || t('inbox.send_failed', 'Failed to send'))
    } finally {
      setSendingReply(false)
    }
  }

  // Turning a mail into work: the task keeps a link to the message, so the
  // person doing it has the original rather than a retyped summary.
  const startTask = () => {
    if (!selected) return
    setTaskForm({
      title: selected.subject || 'Follow up on email',
      description: `From: ${selected.sender_name || ''} <${selected.sender}>`,
      assigned_to: '',
      due_date: '',
    })
  }

  const createTask = async (e) => {
    e.preventDefault()
    if (!taskForm?.title?.trim() || !taskForm.assigned_to) return
    try {
      await api.post('/tasks/', {
        title: taskForm.title.trim(),
        description: taskForm.description || '',
        assigned_to: taskForm.assigned_to,
        due_date: taskForm.due_date || null,
        related_email: selected.id,
      })
      setTaskForm(null)
      alert(t('inbox.task_created', 'Task created and assigned.'))
    } catch (err) {
      alert(err.response?.data?.detail || t('inbox.task_failed', 'Could not create the task'))
    }
  }

  const forward = () => {
    if (!selected) return
    setCompose({
      to: '',
      subject: selected.subject?.toLowerCase().startsWith('fwd:') ? selected.subject : `Fwd: ${selected.subject || ''}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${selected.sender_name || ''} <${selected.sender}>\nDate: ${new Date(selected.received_at).toLocaleString()}\nSubject: ${selected.subject || ''}\n\n${selected.body || ''}`,
      account: selected.account,
    })
  }

  const time = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return dayBucket(ts) === 'Today'
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const initials = (name, email) => {
    const s = (name || email || '?').trim()
    const parts = s.split(/[\s.@]+/).filter(Boolean)
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : s.slice(0, 2)).toUpperCase()
  }

  const NavRow = ({ active, onClick, icon, label, badge, count, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
      }`}
    >
      <span className="text-[13px]">{icon}</span>
      <span className="truncate">{label}</span>
      {badge > 0 ? (
        <span className="ml-auto text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-bold">{badge}</span>
      ) : count > 0 ? (
        <span className="ml-auto text-[10px] text-white/35">{count}</span>
      ) : null}
    </button>
  )

  const folderLabel = FOLDERS.find(f => f.key === folder)?.label || 'Inbox'

  return (
    <div className="min-h-screen py-5 md:py-8">
      <div className="container-main max-w-[1600px]">
        <div className="flex gap-3" style={{ height: 'calc(100vh - 150px)', minHeight: 560 }}>

          {/* ================= SIDEBAR ================= */}
          <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col glass-card !p-0 overflow-hidden">
            <div className="p-3">
              <button
                onClick={() => setCompose({ to: '', subject: '', body: '', account: mailbox })}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors"
              >
                ✏️ {t('inbox.new_mail', 'New Mail')}
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
              <p className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                {t('inbox.folders', 'Folders')}
              </p>
              {FOLDERS.map(f => (
                <NavRow key={f.key} icon={f.icon} label={f.label}
                  active={folder === f.key}
                  badge={folderCounts[f.key]?.unread || 0}
                  count={folderCounts[f.key]?.total || 0}
                  onClick={() => { setFolder(f.key); setTeamView('all') }} />
              ))}

              <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                {t('inbox.views', 'Views')}
              </p>
              {TEAM_VIEWS.map(v => (
                <NavRow key={v.key} icon={v.icon} label={v.label}
                  active={teamView === v.key}
                  onClick={() => setTeamView(v.key)} />
              ))}

              <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                {t('inbox.mailboxes', 'Mailboxes')}
              </p>
              <NavRow icon="🗂️" label={t('inbox.all_mailboxes', 'All mailboxes')}
                active={!mailbox} onClick={() => setMailbox(null)} />
              {mailboxes.map(m => (
                <NavRow key={m.id ?? 'none'} icon={m.is_shared ? '👥' : '👤'}
                  label={m.email_address.split('@')[0]} badge={m.unread}
                  title={m.is_shared ? 'Shared team inbox' : (m.owner ? `Personal · ${m.owner}` : 'Unassigned')}
                  active={String(mailbox) === String(m.id)}
                  onClick={() => setMailbox(m.id)} />
              ))}

              {/* A shared mailbox collects several aliases, so "what came to
                  saidina@" needs to be its own view. */}
              {aliases.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                    {t('inbox.sent_to', 'Sent to')}
                  </p>
                  <NavRow icon="📧" label={t('inbox.any_address', 'Any address')}
                    active={!alias} onClick={() => setAlias(null)} />
                  {aliases.map(a => (
                    <NavRow key={a.address} icon="↪️" label={a.address.split('@')[0]}
                      badge={a.count} title={a.address}
                      active={alias === a.address}
                      onClick={() => { setAlias(a.address); setContacts(null) }} />
                  ))}
                </>
              )}

              {/* Sending used to end at "sent" — this is where a message that
                  never left, or one the recipient opened, becomes visible. */}
              <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                {t('inbox.delivery', 'Delivery')}
              </p>
              <NavRow icon="📮" label={t('inbox.sent_status', 'Sent mail status')}
                active={outbox !== null}
                onClick={() => {
                  if (outbox === null) { setContacts(null); loadOutbox() } else setOutbox(null)
                }} />

              <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                {t('inbox.address_book', 'Address book')}
              </p>
              <NavRow icon="📇" label={t('inbox.contacts', 'Contacts')}
                active={contacts !== null}
                onClick={() => {
                  if (contacts === null) { setOutbox(null); loadContacts() } else setContacts(null)
                }} />
            </div>
          </aside>

          {/* ================= LIST ================= */}
          <section className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-[380px] flex-shrink-0 flex-col glass-card !p-0 overflow-hidden`}>
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-base font-bold text-white truncate">
                  {outbox !== null
                    ? `${t('inbox.sent_status', 'Sent mail status')} (${outbox.length})`
                    : contacts !== null
                      ? `${t('inbox.contacts', 'Contacts')} (${contacts.length})`
                      : alias || folderLabel}
                  {counts.unread > 0 && folder === 'inbox' && (
                    <span className="ml-2 text-[11px] font-semibold text-emerald-400">
                      {counts.unread} {t('inbox.unread', 'unread')}
                    </span>
                  )}
                </h2>
                <button onClick={handleSync} disabled={syncing}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 disabled:opacity-40 whitespace-nowrap">
                  {syncing ? (t('inbox.syncing', 'Syncing…')) : (t('inbox.sync_now', 'Sync'))}
                </button>
              </div>
              {/* Select-all sits on the header row so it reads as "this list",
                  and the actions only appear once something is ticked. */}
              {contacts === null && outbox === null && emails.length > 0 && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <label className="flex items-center gap-1.5 text-[11px] text-white/50 cursor-pointer select-none">
                    <input type="checkbox" checked={allPicked} onChange={togglePickAll}
                      className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer" />
                    {picked.length > 0
                      ? `${picked.length} ${t('inbox.selected', 'selected')}`
                      : t('inbox.select_all', 'Select all')}
                  </label>
                  {picked.length > 0 && (
                    <>
                      <button onClick={() => bulkAction('read')} disabled={acting}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 disabled:opacity-40">
                        ✓ {t('inbox.mark_read', 'Mark read')}
                      </button>
                      <button onClick={() => bulkAction('unread')} disabled={acting}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 disabled:opacity-40">
                        ● {t('inbox.mark_unread', 'Mark unread')}
                      </button>
                      <button onClick={() => bulkAction(teamView === 'archived' ? 'unarchive' : 'archive')}
                        disabled={acting}
                        className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 disabled:opacity-40">
                        🗄️ {teamView === 'archived'
                          ? t('inbox.unarchive', 'Unarchive')
                          : t('inbox.archive', 'Archive')}
                      </button>
                      <button onClick={() => setPicked([])}
                        className="text-[11px] px-2 py-1 rounded-lg text-white/40 hover:text-white/70">
                        {t('inbox.clear', 'Clear')}
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="relative">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t('inbox.search', 'Search mail…')}
                  className="w-full pl-8 pr-3 py-2 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-xs" />
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {outbox !== null ? (
                outbox.length === 0 ? (
                  <div className="p-10 text-center text-white/40 text-sm">
                    {t('inbox.no_sent', 'Nothing sent from here yet')}
                  </div>
                ) : (
                  outbox.map(row => {
                    // Deliberately four states, not two: "sent" is the mail
                    // server accepting it, "opened" is the only evidence a
                    // person saw it, and a failure says whether it is still
                    // trying or has stopped.
                    const chip = {
                      opened:  { icon: '👁️', text: t('inbox.st_opened', 'Opened'),   cls: 'bg-emerald-500/20 text-emerald-300' },
                      sent:    { icon: '✓',  text: t('inbox.st_sent', 'Sent'),       cls: 'bg-sky-500/20 text-sky-300' },
                      queued:  { icon: '🕓', text: t('inbox.st_queued', 'Waiting'),  cls: 'bg-amber-500/20 text-amber-300' },
                      failed:  { icon: '↻',  text: t('inbox.st_retry', 'Retrying'),  cls: 'bg-amber-500/20 text-amber-300' },
                      gave_up: { icon: '⚠️', text: t('inbox.st_failed', 'Not sent'), cls: 'bg-red-500/20 text-red-300' },
                    }[row.status] || { icon: '•', text: row.status, cls: 'bg-white/10 text-white/50' }
                    return (
                      <div key={row.id} className="px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${chip.cls}`}>
                            {chip.icon} {chip.text}
                          </span>
                          <span className="ml-auto text-[10px] text-white/30">
                            {time(row.sent_at || row.created_at)}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold truncate mt-1">{row.subject || '(no subject)'}</p>
                        <p className="text-[11px] text-white/45 truncate">
                          {t('inbox.to_label', 'To')}: {row.to_email}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {row.from_address && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/35">
                              {row.from_address.split('@')[0]}
                            </span>
                          )}
                          {row.open_count > 0 && (
                            <span className="text-[9px] text-white/35">
                              {t('inbox.opened_times', 'opened')} ×{row.open_count}
                            </span>
                          )}
                          {row.attempts > 1 && (
                            <span className="text-[9px] text-white/35">
                              {t('inbox.attempts', 'attempts')}: {row.attempts}
                            </span>
                          )}
                        </div>
                        {row.last_error && (
                          <p className="text-[10px] text-red-300/70 mt-1 line-clamp-2">{row.last_error}</p>
                        )}
                        {row.status !== 'sent' && row.status !== 'opened' && (
                          <button onClick={() => retrySend(row)} disabled={acting}
                            className="mt-1.5 text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40">
                            ↻ {t('inbox.retry_now', 'Send again now')}
                          </button>
                        )}
                      </div>
                    )
                  })
                )
              ) : contacts !== null ? (
                contacts.length === 0 ? (
                  <div className="p-10 text-center text-white/40 text-sm">
                    {t('inbox.no_contacts', 'No contacts yet')}
                  </div>
                ) : (
                  contacts.map(c => (
                    <div key={c.email}
                      className="px-3 py-2.5 flex gap-3 border-b border-white/[0.04] hover:bg-white/[0.03]">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {initials(c.name, c.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{c.name || c.email}</p>
                        <p className="text-[11px] text-white/45 truncate">{c.email}</p>
                        <p className="text-[10px] text-white/25">
                          {c.messages} {t('inbox.messages_count', 'messages')}
                          {c.last_seen ? ` · ${new Date(c.last_seen).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => setCompose({ to: c.email, subject: '', body: '', account: mailbox })}
                        className="self-center px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-400">
                        {t('inbox.write', 'Write')}
                      </button>
                    </div>
                  ))
                )
              ) : loading ? (
                <div className="p-8 text-center text-white/40 text-sm">{t('inbox.loading', 'Loading…')}</div>
              ) : emails.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3 opacity-40">📭</div>
                  <p className="text-white/50 text-sm">{t('inbox.no_emails', 'Nothing here')}</p>
                  <p className="text-white/25 text-xs mt-1">{t('inbox.no_emails_hint', 'Click Sync to check for new mail')}</p>
                </div>
              ) : (
                grouped.map(([bucket, items]) => (
                  <div key={bucket}>
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 bg-white/[0.02] sticky top-0 backdrop-blur-sm">
                      {bucket}
                    </div>
                    {items.map(email => (
                      <div key={email.id}
                        className={`w-full flex items-start gap-2 pl-2 pr-3 border-b border-white/[0.04] transition-colors ${
                          selected?.id === email.id ? 'bg-emerald-500/10'
                            : picked.includes(email.id) ? 'bg-emerald-500/[0.07]' : 'hover:bg-white/[0.03]'
                        }`}>
                      <input type="checkbox" checked={picked.includes(email.id)}
                        onChange={() => togglePick(email.id)}
                        aria-label={t('inbox.select_message', 'Select this message')}
                        className="mt-4 w-3.5 h-3.5 accent-emerald-500 cursor-pointer flex-shrink-0" />
                      <button onClick={() => openEmail(email)}
                        className="flex-1 min-w-0 text-left py-2.5 flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          email.is_read ? 'bg-white/10 text-white/50' : 'bg-gradient-to-br from-emerald-400 to-green-600 text-white'
                        }`}>
                          {initials(email.sender_name, email.sender)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] truncate ${email.is_read ? 'text-white/60' : 'text-white font-semibold'}`}>
                              {email.sender_name || email.sender}
                            </span>
                            <span className="ml-auto text-[10px] text-white/30 flex-shrink-0">{time(email.received_at)}</span>
                          </div>
                          <p className={`text-xs truncate ${email.is_read ? 'text-white/45' : 'text-white/85 font-medium'}`}>
                            {email.subject || '(no subject)'}
                          </p>
                          <p className="text-[11px] text-white/25 truncate">{email.body_preview}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {email.has_attachments && <span className="text-[10px] text-white/30">📎</span>}
                            {!mailbox && email.account_email && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/35 truncate max-w-[110px]">
                                {email.account_email.split('@')[0]}
                              </span>
                            )}
                            {email.assigned_to_name && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 truncate max-w-[90px]">
                                👤 {email.assigned_to_name}
                              </span>
                            )}
                            {!email.is_read && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          </div>
                        </div>
                      </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ================= READER ================= */}
          <section className={`${showList ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 flex-col glass-card !p-0 overflow-hidden`}>
            {selected ? (
              <>
                {/* toolbar */}
                <div className="px-4 py-2.5 border-b border-white/5 flex flex-wrap items-center gap-1.5">
                  <button onClick={() => setShowList(true)}
                    className="md:hidden w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60" aria-label="Back">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {selected.assigned_to ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                      👤 {selected.assigned_to_name}
                      <button onClick={() => unassign(selected)} disabled={acting}
                        className="text-emerald-300/60 hover:text-red-300" title="Unassign">✕</button>
                    </span>
                  ) : (
                    <button onClick={() => assignToMe(selected)} disabled={acting}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-400 disabled:opacity-40">
                      {t('inbox.assign_me', 'Assign to me')}
                    </button>
                  )}
                  <button onClick={() => archive(selected, !selected.is_archived)} disabled={acting}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] font-semibold hover:bg-white/10 disabled:opacity-40">
                    🗄️ {selected.is_archived ? (t('inbox.unarchive', 'Unarchive')) : (t('inbox.archive', 'Archive'))}
                  </button>
                  <button onClick={() => snooze(selected, 24)} disabled={acting}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] font-semibold hover:bg-white/10 disabled:opacity-40">
                    🕓 {t('inbox.snooze', 'Snooze')}
                  </button>
                  <button onClick={forward}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] font-semibold hover:bg-white/10">
                    ↪️ {t('inbox.forward', 'Forward')}
                  </button>
                  {assignables.length > 0 && (
                    <button onClick={startTask}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] font-semibold hover:bg-white/10">
                      ✅ {t('inbox.create_task', 'Create task')}
                    </button>
                  )}
                  <button onClick={() => markUnread(selected)}
                    className="ml-auto text-[11px] text-white/40 hover:text-emerald-400 whitespace-nowrap">
                    {t('inbox.mark_unread', 'Mark unread')}
                  </button>
                </div>

                {/* header */}
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white break-words">{selected.subject || '(no subject)'}</h2>
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {initials(selected.sender_name, selected.sender)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white/70 truncate">
                        {selected.sender_name || selected.sender} <span className="text-white/35">&lt;{selected.sender}&gt;</span>
                      </p>
                      <p className="text-[11px] text-white/30">
                        {t('inbox.to', 'to')} {selected.recipient || selected.account_email} · {new Date(selected.received_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* body */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                  {/* Sender-authored HTML carries its own (usually dark-on-white)
                      colours, so render it on a white sheet rather than fighting it. */}
                  {selected.body_html ? (
                    <div className="mail-body text-sm leading-relaxed overflow-x-auto [&_img]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                  ) : (
                    <pre className="mail-body text-sm whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
                  )}

                  {/* What came with it. Clicking opens the file itself —
                      fetched from Zoho through the API, so a PDF opens in the
                      browser like it would in any mail client. */}
                  {selected.has_attachments && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <p className="text-[11px] uppercase tracking-wider text-white/35 font-bold mb-2">
                        📎 {t('inbox.attachments', 'Attachments')}
                        {inbound.length > 0 && ` (${inbound.length})`}
                      </p>
                      {inboundError ? (
                        <p className="text-[11px] text-red-300">{inboundError}</p>
                      ) : inbound.length === 0 ? (
                        <p className="text-[11px] text-white/35">
                          {t('inbox.attachments_loading', 'Reading the attachments…')}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {inbound.map(a => (
                            <a key={a.id}
                              href={`${api.defaults.baseURL}/api/v1/email-inbox/${selected.id}/attachment/${encodeURIComponent(a.id)}/`}
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
                              <span>{/\.(png|jpe?g|gif|webp)$/i.test(a.name) ? '🖼️'
                                : /\.pdf$/i.test(a.name) ? '📕'
                                : /\.(docx?|odt)$/i.test(a.name) ? '📘'
                                : /\.(xlsx?|csv)$/i.test(a.name) ? '📗' : '📄'}</span>
                              <span className="text-xs text-emerald-300 underline truncate max-w-[220px]">{a.name}</span>
                              {a.size > 0 && (
                                <span className="text-[10px] text-white/35">
                                  {a.size > 1048576 ? `${(a.size / 1048576).toFixed(1)} MB`
                                    : `${Math.max(1, Math.round(a.size / 1024))} KB`}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* reply */}
                <form onSubmit={handleReply} className="border-t border-white/5 p-3">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows="3"
                    placeholder={t('inbox.reply_placeholder', 'Write a reply…')}
                    className="w-full px-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none" />
                  {/* Attachments: the only way a document reaches a client —
                      files uploaded to a job stay internal until they are sent. */}
                  {(replyFiles.length > 0 || replyDocs.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {replyFiles.map((f, i) => (
                        <span key={`f${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-200 text-[11px]">
                          📎 <span className="truncate max-w-[160px]">{f.name}</span>
                          <button type="button" onClick={() => setReplyFiles(list => list.filter((_, x) => x !== i))}
                            className="text-emerald-300/60 hover:text-red-300">✕</button>
                        </span>
                      ))}
                      {replyDocs.map(d => (
                        <span key={d.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 text-sky-200 text-[11px]">
                          📁 <span className="truncate max-w-[160px]">{d.title}</span>
                          <button type="button" onClick={() => setReplyDocs(list => list.filter(x => x.id !== d.id))}
                            className="text-sky-300/60 hover:text-red-300">✕</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Files already on a client job — no need to find them on a
                      laptop again just to send them. */}
                  {docPicker !== null && (
                    <div className="mt-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                      <input autoFocus value={docPicker} onChange={e => setDocPicker(e.target.value)}
                        placeholder={t('inbox.search_job_files', 'Search the job files…')}
                        className="w-full px-3 py-2 glass text-white placeholder:text-white/25 rounded-lg border-0 outline-none text-xs mb-1.5" />
                      <div className="max-h-40 overflow-y-auto">
                        {docHits.length === 0 ? (
                          <p className="text-[11px] text-white/30 px-1 py-2">
                            {t('inbox.no_job_files', 'No files on your jobs yet')}
                          </p>
                        ) : docHits.map(d => (
                          <button type="button" key={d.id}
                            onClick={() => {
                              setReplyDocs(list => list.some(x => x.id === d.id) ? list : [...list, d])
                              setDocPicker(null)
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.06]">
                            <p className="text-[12px] text-white/85 truncate">📁 {d.title}</p>
                            <p className="text-[10px] text-white/35 truncate">
                              {d.file_size_display || ''} {d.uploaded_by_name ? `· ${d.uploaded_by_name}` : ''}
                            </p>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setDocPicker(null)}
                        className="mt-1 text-[10px] text-white/40 hover:text-white/70">
                        {t('inbox.cancel', 'Cancel')}
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <label className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 cursor-pointer">
                        📎 {t('inbox.attach', 'Attach')}
                        <input type="file" multiple className="hidden"
                          onChange={e => {
                            setReplyFiles(list => [...list, ...Array.from(e.target.files || [])])
                            e.target.value = ''
                          }} />
                      </label>
                      <button type="button" onClick={() => setDocPicker(docPicker === null ? '' : null)}
                        title={t('inbox.from_job_files_hint', 'Attach a file already held on a client job')}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10">
                        📁 {t('inbox.from_job_files', 'From job files')}
                      </button>
                    </div>
                    {/* Reply as: a person who reads accounts@ may need to answer
                        as prisila.neema@ */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] text-white/30 flex-shrink-0">
                        {t('inbox.reply_as', 'Reply as')}
                      </span>
                      <select value={replyFrom} onChange={e => setReplyFrom(e.target.value)}
                        className="text-[11px] glass rounded-lg px-2 py-1 border-0 outline-none max-w-[220px] truncate">
                        <option value="">{selected.account_email || t('inbox.from_default', 'default address')}</option>
                        {fromOptions.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={sendingReply || !replyText.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold disabled:opacity-40">
                      {sendingReply ? (t('inbox.sending', 'Sending…')) : (t('inbox.send_reply', 'Reply'))}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="text-5xl mb-4 opacity-30">✉️</div>
                <p className="text-white/50 font-medium">{t('inbox.select_email', 'Select a message')}</p>
                <p className="text-white/25 text-sm mt-1">
                  {t('inbox.select_email_hint', 'Pick one from the list to read, reply or assign')}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ================= TASK FROM EMAIL ================= */}
      {taskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setTaskForm(null)}>
          <form onSubmit={createTask} onClick={e => e.stopPropagation()}
            className="glass-card !p-0 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t('inbox.create_task', 'Create task')}</h3>
              <button type="button" onClick={() => setTaskForm(null)} className="text-white/40 hover:text-red-400">✕</button>
            </div>
            <div className="p-4 space-y-2">
              <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder={t('inbox.task_title', 'What needs doing?')} required
                className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none text-sm" />
              <select value={taskForm.assigned_to} required
                onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full px-3 py-2.5 glass text-white rounded-xl border-0 outline-none text-sm">
                <option value="">{t('inbox.assign_to', 'Assign to…')}</option>
                {assignables.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                ))}
              </select>
              <label className="block text-[11px] text-white/40 pt-1">
                {t('inbox.due_by', 'Feedback due by')}
              </label>
              <input type="date" value={taskForm.due_date}
                onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="w-full px-3 py-2.5 glass text-white rounded-xl border-0 outline-none text-sm" />
              <p className="text-[11px] text-white/35 pt-1">
                ✉️ {selected?.subject} — {t('inbox.task_keeps_email', 'the assignee gets this email with the task')}
              </p>
            </div>
            <div className="px-4 pb-4 flex justify-end gap-2">
              <button type="button" onClick={() => setTaskForm(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-white/70 text-sm font-semibold hover:bg-white/10">
                {t('inbox.cancel', 'Cancel')}
              </button>
              <button type="submit"
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold">
                {t('inbox.assign', 'Assign')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= COMPOSE ================= */}
      {compose && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-6"
          onClick={() => setCompose(null)}>
          <form onSubmit={sendCompose} onClick={e => e.stopPropagation()}
            className="glass-card !p-0 w-full md:max-w-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t('inbox.new_mail', 'New Mail')}</h3>
              <button type="button" onClick={() => setCompose(null)} className="text-white/40 hover:text-red-400">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {mailboxes.length > 0 && (
                <select value={compose.account || ''} onChange={e => setCompose({ ...compose, account: e.target.value })}
                  className="w-full px-3 py-2.5 glass text-white rounded-xl border-0 outline-none text-sm">
                  <option value="" style={{ backgroundColor: '#0d3320', color: '#fff' }}>
                    {t('inbox.from_default', 'From: default mailbox')}
                  </option>
                  {mailboxes.filter(m => m.id).map(m => (
                    <option key={m.id} value={m.id} style={{ backgroundColor: '#0d3320', color: '#fff' }}>
                      {t('inbox.from', 'From')}: {m.email_address}
                    </option>
                  ))}
                </select>
              )}
              <input value={compose.to} onChange={e => setCompose({ ...compose, to: e.target.value })}
                placeholder={t('inbox.to_placeholder', 'To (email address)')} type="email" required
                className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
              <input value={compose.subject} onChange={e => setCompose({ ...compose, subject: e.target.value })}
                placeholder={t('inbox.subject', 'Subject')}
                className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm" />
              <textarea value={compose.body} onChange={e => setCompose({ ...compose, body: e.target.value })}
                rows="9" placeholder={t('inbox.message', 'Write your message…')}
                className="w-full px-3 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none" />
            </div>
            <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
              <label className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/10 cursor-pointer">
                📎 {t('inbox.attach', 'Attach')}
                <input type="file" multiple className="hidden"
                  onChange={e => {
                    const picked = Array.from(e.target.files || [])
                    setCompose(c => ({ ...c, files: [...(c.files || []), ...picked] }))
                    e.target.value = ''
                  }} />
              </label>
              {(compose.files || []).map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-200 text-[11px]">
                  📎 <span className="truncate max-w-[160px]">{f.name}</span>
                  <button type="button"
                    onClick={() => setCompose(c => ({ ...c, files: c.files.filter((_, x) => x !== i) }))}
                    className="text-emerald-300/60 hover:text-red-300">✕</button>
                </span>
              ))}
            </div>
            <div className="px-4 pb-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCompose(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-white/70 text-sm font-semibold hover:bg-white/10">
                {t('inbox.cancel', 'Cancel')}
              </button>
              <button type="submit" disabled={sendingReply || !compose.to.trim()}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold disabled:opacity-40">
                {sendingReply ? (t('inbox.sending', 'Sending…')) : (t('inbox.send', 'Send'))}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default EmailInboxPage
