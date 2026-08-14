// src/features/notifications/pages/EmailInboxPage.jsx
//
// Full mail client: folders + views on the left, a date-grouped message list in
// the middle, and the message with reply/forward on the right — plus the team
// bits a plain mail client doesn't have (assign, archive, snooze, shared
// mailboxes), so staff can work here instead of in Zoho.

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'

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

  useEffect(() => { loadEmails() }, [loadEmails])
  useEffect(() => { loadMailboxes() }, [loadMailboxes])

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
      await api.post(`/email-inbox/${selected.id}/reply/`, {
        body: replyText.trim(),
        ...(replyFrom ? { from_address: replyFrom } : {}),
      })
      setSelected(prev => ({ ...prev, is_processed: true }))
      setReplyText('')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const sendCompose = async (e) => {
    e.preventDefault()
    if (!compose?.to?.trim()) return
    setSendingReply(true)
    try {
      await api.post('/email-inbox/compose/', {
        to: compose.to.trim(),
        subject: compose.subject || '',
        body: compose.body || '',
        account: compose.account || mailbox || undefined,
      })
      setCompose(null)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send')
    } finally {
      setSendingReply(false)
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

              <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-wider text-white/30 font-bold">
                {t('inbox.address_book', 'Address book')}
              </p>
              <NavRow icon="📇" label={t('inbox.contacts', 'Contacts')}
                active={contacts !== null}
                onClick={() => (contacts === null ? loadContacts() : setContacts(null))} />
            </div>
          </aside>

          {/* ================= LIST ================= */}
          <section className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-[380px] flex-shrink-0 flex-col glass-card !p-0 overflow-hidden`}>
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-base font-bold text-white truncate">
                  {contacts !== null
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
              {contacts !== null ? (
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
                      <button key={email.id} onClick={() => openEmail(email)}
                        className={`w-full text-left px-3 py-2.5 flex gap-3 border-b border-white/[0.04] transition-colors ${
                          selected?.id === email.id ? 'bg-emerald-500/10' : 'hover:bg-white/[0.03]'
                        }`}>
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
                </div>

                {/* reply */}
                <form onSubmit={handleReply} className="border-t border-white/5 p-3">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows="3"
                    placeholder={t('inbox.reply_placeholder', 'Write a reply…')}
                    className="w-full px-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none" />
                  <div className="flex items-center justify-between mt-2">
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
