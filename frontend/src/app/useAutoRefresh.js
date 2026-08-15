// frontend/src/app/useAutoRefresh.js
//
// Pages fetched their data once, on mount. A tab left open all morning kept
// showing the morning's content, and the only way to see a service that had
// just been edited was to reload the browser.
//
// This returns a counter that goes up when the page should fetch again:
// when the tab is brought back to the front, when the network comes back,
// and on a slow timer while the tab is actually visible. Put it in the
// dependency array of the effect that loads the data:
//
//     const refresh = useAutoRefresh()
//     useEffect(() => { load() }, [refresh])
//
// Nothing is remounted and no state is thrown away — a half-typed form
// survives a refresh, which is why this is a counter and not a reload.

import { useEffect, useRef, useState } from 'react'

export default function useAutoRefresh({ interval = 60000, minGap = 15000 } = {}) {
  const [tick, setTick] = useState(0)
  const lastRef = useRef(Date.now())

  useEffect(() => {
    const bump = () => {
      lastRef.current = Date.now()
      setTick(t => t + 1)
    }

    // Coming back to the tab is the moment stale content is noticed — but
    // flicking between two tabs shouldn't refetch on every glance.
    const onReturn = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastRef.current < minGap) return
      bump()
    }

    // A background tab is throttled by the browser anyway; skipping it keeps
    // a forgotten tab from polling the API all night.
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') bump()
    }, interval)

    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('focus', onReturn)
    window.addEventListener('online', onReturn)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('online', onReturn)
    }
  }, [interval, minGap])

  return tick
}
