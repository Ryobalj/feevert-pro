// src/features/accounts/components/SessionTimeout.jsx
//
// Signing in used to last a week whether or not anyone was there. On a shared
// office machine that means the next person to sit down is still signed in as
// a colleague — with their mail, their drafts and, for an admin, everyone's.
//
// So a session now ends after a stretch of no activity. A warning comes first,
// because being thrown out mid-sentence is its own kind of data loss.
//
// Activity is shared across tabs through localStorage: working in one tab
// keeps every tab alive, which is what a person would expect from "I am still
// here".

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const IDLE_LIMIT_MS = 30 * 60 * 1000   // 30 minutes of nothing at all
const WARN_BEFORE_MS = 60 * 1000       // one minute of notice
const CHECK_EVERY_MS = 10 * 1000
const STORAGE_KEY = 'last_activity_at'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel']

const SessionTimeout = ({ isAuthenticated, onExpire }) => {
  const { t } = useTranslation('account')
  const [secondsLeft, setSecondsLeft] = useState(null)   // null = no warning showing
  const expiredRef = useRef(false)

  const touch = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* private mode */ }
    setSecondsLeft(null)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    expiredRef.current = false
    touch()

    const onActivity = () => {
      // While the warning is up, only a deliberate click dismisses it —
      // otherwise a stray scroll would silently cancel it and the person
      // would never learn their session nearly ended.
      if (secondsLeftRef.current === null) touch()
    }
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }))
    return () => ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity))
  }, [isAuthenticated, touch])

  // Kept in a ref so the listener above reads the current value without
  // being torn down and rebuilt every second.
  const secondsLeftRef = useRef(null)
  useEffect(() => { secondsLeftRef.current = secondsLeft }, [secondsLeft])

  useEffect(() => {
    if (!isAuthenticated) return
    const id = setInterval(() => {
      const last = Number(localStorage.getItem(STORAGE_KEY) || Date.now())
      const idleFor = Date.now() - last
      const remaining = IDLE_LIMIT_MS - idleFor

      if (remaining <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true
          onExpire()
        }
        return
      }
      setSecondsLeft(remaining <= WARN_BEFORE_MS ? Math.ceil(remaining / 1000) : null)
    }, CHECK_EVERY_MS)
    return () => clearInterval(id)
  }, [isAuthenticated, onExpire])

  if (!isAuthenticated || secondsLeft === null) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="glass-card p-6 w-[min(92vw,380px)] text-center">
        <div className="text-3xl mb-2">⏳</div>
        <h3 className="text-lg font-bold text-white mb-1">
          {t('session.title', 'Still there?')}
        </h3>
        <p className="text-sm text-white/60 mb-4">
          {t('session.warning', 'You will be signed out in')} <b className="text-emerald-300">{secondsLeft}s</b>
          {' '}{t('session.warning_tail', 'because of inactivity.')}
        </p>
        <div className="flex gap-2">
          <button onClick={touch}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold">
            {t('session.stay', 'Keep me signed in')}
          </button>
          <button onClick={onExpire}
            className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white/70 text-sm font-semibold">
            {t('session.logout', 'Sign out')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionTimeout
