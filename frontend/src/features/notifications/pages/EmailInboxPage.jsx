// src/features/notifications/pages/EmailInboxPage.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../../app/api'

const EmailInboxPage = () => {
  const { t } = useTranslation('notifications')
  const [emails, setEmails] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const loadEmails = useCallback(async () => {
    setLoading(true)
    try {
      // The API paginates at 9 by default, which made a full mailbox look
      // nearly empty — ask for a mailbox-sized page instead.
      const res = await api.get('/email-inbox/?page_size=200')
      setEmails(res.data?.results || res.data || [])
    } catch (error) {
      console.error('Error loading inbox:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEmails() }, [loadEmails])

  const openEmail = async (email) => {
    try {
      const res = await api.get(`/email-inbox/${email.id}/`)
      setSelected(res.data)
      setReplyText('')
      if (!email.is_read) {
        await api.post(`/email-inbox/${email.id}/mark_read/`)
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
      }
    } catch (error) {
      console.error('Error opening email:', error)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await api.post('/email-inbox/sync_now/')
      setSyncResult(res.data)
      await loadEmails()
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
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="container-main py-8 md:py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {t('inbox.title') || 'Email Inbox'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {t('inbox.subtitle') || 'Emails sent to your business address, all in one place'}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-5 py-2.5 rounded-full bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? (t('inbox.syncing') || 'Syncing...') : (t('inbox.sync_now') || 'Sync Now')}
        </button>
      </div>

      {syncResult && (
        <div className="mb-6 glass-card text-sm space-y-1">
          {Object.entries(syncResult).map(([source, result]) => (
            <p key={source} className={result.success ? 'text-emerald-400' : 'text-amber-400'}>
              <span className="font-semibold uppercase">{source}:</span>{' '}
              {result.success ? `${result.saved || 0} new email(s)` : result.error}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-4" style={{ height: 'calc(100vh - 320px)', minHeight: 450 }}>
        {/* Email list */}
        <div className="w-full md:w-96 flex-shrink-0 h-full glass-card !p-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="spinner mx-auto mb-3" />
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center text-2xl">📧</div>
                <p className="text-white/50 text-sm">{t('inbox.no_emails') || 'No emails yet'}</p>
                <p className="text-white/30 text-xs mt-1">{t('inbox.no_emails_hint') || 'Click "Sync Now" to check for new messages'}</p>
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => openEmail(email)}
                  className={`w-full p-4 flex flex-col gap-1 text-left border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    selected?.id === email.id ? 'bg-emerald-500/10 border-r-2 border-r-emerald-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${email.is_read ? 'text-white/60' : 'text-white font-bold'}`}>
                      {email.sender_name || email.sender}
                    </span>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{formatDate(email.received_at)}</span>
                  </div>
                  <p className={`text-sm truncate ${email.is_read ? 'text-white/40' : 'text-white/70'}`}>
                    {email.subject || '(No Subject)'}
                  </p>
                  <p className="text-xs text-white/30 truncate">{email.body_preview}</p>
                  {email.account_email && (
                    <span className="text-[10px] text-emerald-400/70">→ {email.account_email}</span>
                  )}
                  {!email.is_read && <span className="w-2 h-2 bg-emerald-400 rounded-full absolute right-4" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail + reply */}
        <div className={`flex-1 h-full min-w-0 glass-card !p-0 flex flex-col overflow-hidden ${selected ? '' : 'hidden md:flex'}`}>
          {selected ? (
            <>
              <div className="p-5 border-b border-white/5">
                <h2 className="font-bold text-white text-lg mb-1">{selected.subject || '(No Subject)'}</h2>
                <p className="text-sm text-white/50">
                  {selected.sender_name ? `${selected.sender_name} <${selected.sender}>` : selected.sender}
                </p>
                <p className="text-xs text-white/30 mt-1">{formatDate(selected.received_at)}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {selected.body_html ? (
                  <div className="text-white/80 text-sm" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{selected.body}</p>
                )}
              </div>
              <form onSubmit={handleReply} className="p-4 border-t border-white/5">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('inbox.reply_placeholder') || 'Write a reply...'}
                  rows={3}
                  className="w-full px-4 py-3 glass text-white placeholder:text-white/25 rounded-xl border-0 outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all text-sm resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-6 py-2.5 rounded-full bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (t('inbox.sending') || 'Sending...') : (t('inbox.send_reply') || 'Send Reply')}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-4xl mb-4">📧</div>
              <p className="text-white/50 font-medium">{t('inbox.select_email') || 'Select an email'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailInboxPage
