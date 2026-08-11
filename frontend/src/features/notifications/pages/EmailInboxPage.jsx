// src/features/notifications/pages/EmailInboxPage.jsx
//
// Team inbox, TeamInbox-style: mailboxes + views on the left, the conversation
// list in the middle, and the message with its reply box on the right.

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'

const VIEWS = [
  { key: 'all', label: 'All mail', icon: '📥' },
  { key: 'unread', label: 'Unread', icon: '🔵' },
  { key: 'attachments', label: 'With attachments', icon: '📎' },
]

// Team-inbox tabs: who is on what, and what's already been dealt with.
const TABS = [
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'mine', label: 'Assigned to me' },
  { key: 'all', label: 'All' },
  { key: 'archived', label: 'Archived' },
]

const EmailInboxPage = () => {
  const { t } = useTranslation('notifications')
  const [emails, setEmails] = useState([])
  const [mailboxes, setMailboxes] = useState([])
  const [counts, setCounts] = useState({ total: 0, unread: 0 })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [view, setView] = useState('all')
  const [mailbox, setMailbox] = useState(null)   // account id, null = all
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true) // mobile: list vs reader
  const [tab, setTab] = useState('unassigned')
  const [acting, setActing] = useState(false)

  const loadEmails = useCallback(async () => {
    setLoading(true)
    try {
      // The API paginates at 9 by default, which made a full mailbox look
      // nearly empty — ask for a mailbox-sized page instead.
      const params = new URLSearchParams({ page_size: '200' })
      if (mailbox) params.set('account', mailbox)
      if (view === 'unread') params.set('is_read', 'false')
      if (search.trim()) params.set('search', search.trim())
      // Archived is its own tab; every other tab shows live conversations.
      params.set('is_archived', tab === 'archived' ? 'true' : 'false')
      if (tab === 'unassigned') params.set('assigned_to', 'none')
      if (tab === 'mine') params.set('assigned_to', 'me')
      const res = await api.get(`/email-inbox/?${params.toString()}`)
      setEmails(res.data?.results || res.data || [])
    } catch (error) {
      console.error('Error loading inbox:', error)
    } finally {
      setLoading(false)
    }
  }, [mailbox, view, search, tab])

  // Team-inbox actions
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

  const assignToMe = (email) => runAction(email, 'assign')
  const unassign = (email) => runAction(email, 'assign', { user_id: null })
  const archive = (email, archived = true) => runAction(email, 'archive', { archived })
  const snooze = (email, hours) => runAction(email, 'snooze', { hours })

  const loadMailboxes = useCallback(async () => {
    try {
      const res = await api.get('/email-inbox/mailboxes/')
      setMailboxes(res.data?.mailboxes || [])
      setCounts({ total: res.data?.total || 0, unread: res.data?.unread || 0 })
    } catch (error) {
      console.error('Error loading mailboxes:', error)
    }
  }, [])

  useEffect(() => { loadEmails() }, [loadEmails])
  useEffect(() => { loadMailboxes() }, [loadMailboxes])

  const visible = useMemo(
    () => (view === 'attachments' ? emails.filter(e => e.has_attachments) : emails),
    [emails, view]
  )

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

  const markUnread = async (email) => {
    try {
      await api.post(`/email-inbox/${email.id}/mark_unread/`)
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: false } : e))
      loadMailboxes()
    } catch (error) { console.error(error) }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await api.post('/email-inbox/sync_now/')
      setSyncResult(res.data)
      await Promise.all([loadEmails(), loadMailboxes()])
    } catch (error) {
      console.error('Error syncing inbox:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selected) return
    setSendingReply(true)
    try {
      await api.post(`/email-inbox/${selected.id}/reply/`, { body: replyText.trim() })
      setSelected(prev => ({ ...prev, is_processed: true }))
      setReplyText('')
    } catch (error) {
      console.error('Error sending reply:', error)
      alert(error.response?.data?.error || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const initials = (name, email) => {
    const s = (name || email || '?').trim()
    const parts = s.split(/[\s.@]+/).filter(Boolean)
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : s.slice(0, 2)).toUpperCase()
  }

  const activeMailboxLabel = mailbox
    ? (mailboxes.find(m => String(m.id) === String(mailbox))?.email_address || 'Mailbox')
    : (VIEWS.find(v => v.key === view)?.label || 'All mail')

  return (
    <div className="dark-surface min-h-screen py-6 md:py-10">
      <div className="container-main max-w-[1500px]">
        {/* ============ HEADER ============ */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {t('inbox.title') || 'Team Inbox'}
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              {counts.total} {t('inbox.messages') || 'messages'}
              {counts.unread > 0 && <> · <span className="text-emerald-400 font-semibold">{counts.unread} {t('inbox.unread') || 'unread'}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('inbox.search') || 'Search mail…'}
                className="w-56 md:w-72 pl-9 pr-3 py-2.5 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {syncing ? (t('inbox.syncing') || 'Syncing…') : (t('inbox.sync_now') || 'Sync')}
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            {t('inbox.sync_done') || 'Sync complete.'}
          </div>
        )}

        {/* ============ 3 PANES ============ */}
        <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}>
          {/* --- Sidebar: views + mailboxes --- */}
          <aside className="hidden md:flex w-60 flex-shrink-0 flex-col glass-card !p-0 overflow-hidden">
            <div className="p-3 overflow-y-auto">
              <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                {t('inbox.views') || 'Views'}
              </p>
              {VIEWS.map(v => (
                <button
                  key={v.key}
                  onClick={() => { setView(v.key); setMailbox(null) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    view === v.key && !mailbox
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{v.icon}</span>
                  <span className="truncate">{v.label}</span>
                  {v.key === 'unread' && counts.unread > 0 && (
                    <span className="ml-auto text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                      {counts.unread}
                    </span>
                  )}
                </button>
              ))}

              <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                {t('inbox.mailboxes') || 'Mailboxes'}
              </p>
              {mailboxes.length === 0 && (
                <p className="px-3 py-2 text-xs text-white/25">{t('inbox.no_mailboxes') || 'No mailboxes yet'}</p>
              )}
              {mailboxes.map(m => (
                <button
                  key={m.id ?? 'none'}
                  onClick={() => { setMailbox(m.id); setView('all') }}
                  title={m.is_shared ? 'Shared team inbox' : (m.owner ? `Personal · ${m.owner}` : 'Unassigned')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    String(mailbox) === String(m.id)
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{m.is_shared ? '👥' : '👤'}</span>
                  <span className="truncate">{m.email_address.split('@')[0]}</span>
                  {m.unread > 0 && (
                    <span className="ml-auto text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                      {m.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* --- Conversation list --- */}
          <section className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-[360px] flex-shrink-0 flex-col glass-card !p-0 overflow-hidden`}>
            <div className="px-4 pt-3 pb-2 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-white truncate">{activeMailboxLabel}</h2>
                <span className="text-[11px] text-white/30">{visible.length}</span>
              </div>
              <div className="flex gap-1">
                {TABS.map(tb => (
                  <button
                    key={tb.key}
                    onClick={() => setTab(tb.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      tab === tb.key
                        ? 'bg-emerald-500 text-white'
                        : 'text-white/45 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-white/40 text-sm">{t('inbox.loading') || 'Loading…'}</div>
              ) : visible.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3 opacity-40">📭</div>
                  <p className="text-white/50 text-sm">{t('inbox.no_emails') || 'No conversations in this view'}</p>
                  <p className="text-white/25 text-xs mt-1">{t('inbox.no_emails_hint') || 'Click Sync to check for new mail'}</p>
                </div>
              ) : (
                visible.map(email => (
                  <button
                    key={email.id}
                    onClick={() => openEmail(email)}
                    className={`w-full text-left px-3 py-3 flex gap-3 border-b border-white/[0.04] transition-colors ${
                      selected?.id === email.id ? 'bg-emerald-500/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                      email.is_read ? 'bg-white/10 text-white/50' : 'bg-gradient-to-br from-emerald-400 to-green-600 text-white'
                    }`}>
                      {initials(email.sender_name, email.sender)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${email.is_read ? 'text-white/60' : 'text-white font-semibold'}`}>
                          {email.sender_name || email.sender}
                        </span>
                        <span className="ml-auto text-[10px] text-white/30 flex-shrink-0">{formatDate(email.received_at)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${email.is_read ? 'text-white/40' : 'text-white/80 font-medium'}`}>
                        {email.subject || '(no subject)'}
                      </p>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{email.body_preview}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {email.has_attachments && <span className="text-[10px] text-white/30">📎</span>}
                        {email.account_email && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/35 truncate max-w-[120px]">
                            {email.account_email}
                          </span>
                        )}
                        {email.assigned_to_name && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 truncate max-w-[90px]">
                            👤 {email.assigned_to_name}
                          </span>
                        )}
                        {!email.is_read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* --- Reader --- */}
          <section className={`${showList ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 flex-col glass-card !p-0 overflow-hidden`}>
            {selected ? (
              <>
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setShowList(true)}
                      className="md:hidden w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60 flex-shrink-0"
                      aria-label="Back"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-white break-words">{selected.subject || '(no subject)'}</h2>
                      <p className="text-xs text-white/45 mt-1">
                        <span className="text-white/70">{selected.sender_name || selected.sender}</span>
                        {' '}&lt;{selected.sender}&gt;
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {t('inbox.to') || 'to'} {selected.recipient || selected.account_email} · {new Date(selected.received_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Team-inbox toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {selected.assigned_to ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                        👤 {selected.assigned_to_name}
                        <button onClick={() => unassign(selected)} disabled={acting}
                          className="text-emerald-300/60 hover:text-red-300" title="Unassign">✕</button>
                      </span>
                    ) : (
                      <button onClick={() => assignToMe(selected)} disabled={acting}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-400 disabled:opacity-40">
                        {t('inbox.assign_me') || 'Assign to me'}
                      </button>
                    )}
                    <button onClick={() => archive(selected, !selected.is_archived)} disabled={acting}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] font-semibold hover:bg-white/10 disabled:opacity-40">
                      {selected.is_archived ? (t('inbox.unarchive') || 'Unarchive') : (t('inbox.archive') || 'Archive')}
                    </button>
                    <button onClick={() => snooze(selected, 24)} disabled={acting}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/70 text-[11px] font-semibold hover:bg-white/10 disabled:opacity-40">
                      {t('inbox.snooze') || 'Snooze 1d'}
                    </button>
                    <button onClick={() => markUnread(selected)}
                      className="ml-auto text-[11px] text-white/40 hover:text-emerald-400 whitespace-nowrap">
                      {t('inbox.mark_unread') || 'Mark unread'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                  {selected.body_html ? (
                    <div
                      className="text-sm text-white/75 leading-relaxed [&_a]:text-emerald-400 [&_img]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: selected.body_html }}
                    />
                  ) : (
                    <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans leading-relaxed">
                      {selected.body}
                    </pre>
                  )}
                </div>

                <form onSubmit={handleReply} className="border-t border-white/5 p-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows="3"
                    placeholder={t('inbox.reply_placeholder') || 'Write a reply…'}
                    className="w-full px-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-white/30">
                      {t('inbox.replying_from') || 'Replying from'} {selected.account_email || 'default address'}
                    </span>
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
                    >
                      {sendingReply ? (t('inbox.sending') || 'Sending…') : (t('inbox.send_reply') || 'Send reply')}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="text-5xl mb-4 opacity-30">✉️</div>
                <p className="text-white/50 font-medium">{t('inbox.select_email') || 'Select a conversation'}</p>
                <p className="text-white/25 text-sm mt-1">
                  {t('inbox.select_email_hint') || 'Pick a message from the list to read and reply'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default EmailInboxPage
