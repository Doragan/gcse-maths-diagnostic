'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { headChanged, shouldPause, POLL_MS, type ProgressRow, type ResultsHead } from './liveProgress'

// ─────────────────────────────────────────────────────────────────────────────
// The polling loop behind every live progress view.
//
// Extracted from app/dashboard/assignments/[id] when the class-session view
// needed the same behaviour (docs/audit/29, increment 5). The DECISIONS here
// are from docs/audit/24 Part 3 and all of them are load-bearing:
//
//   * POLLING, NOT REALTIME. A postgres_changes payload is a raw row carrying
//     an id and nothing nameable, so it could only ever supplement a snapshot
//     that joins names and aggregates, never replace it. Two code paths for
//     one view, one of them duplicating server-side completion logic.
//   * A CHEAP HEAD PROBE first. The full payload runs several queries; at 10s
//     that is ~360 recomputes an hour per open tab, nearly all returning what
//     the client already has. The probe is a count and a timestamp.
//   * STOP WHEN HIDDEN, catch up on return. A teacher has many tabs.
//   * STAND DOWN after a long quiet spell, with a resume affordance, because a
//     teacher leaves tabs open for days and a lesson lasts an hour.
//
// Taking the two fetches as callbacks keeps this hook ignorant of what it is
// watching: assignments resolve a roster through classes and memberships,
// sessions read one table, and both end up as ProgressRow[].
// ─────────────────────────────────────────────────────────────────────────────

type Options = {
  /** False while the page is still loading, or has nothing to watch. */
  enabled: boolean
  /** The cheap "has anything changed?" probe. */
  fetchHead: () => Promise<ResultsHead>
  /** The full payload, fetched only when the head moves. */
  fetchRows: () => Promise<ProgressRow[]>
}

type LiveProgress = {
  rows: ProgressRow[]
  /** True during the first load only — later refetches are silent. */
  loading: boolean
  /** Whether the view is keeping itself up to date. */
  live: boolean
  /** Restart polling after it stood down. */
  resume: () => void
  /** Advances on each probe, so "answering now" and the clock times decay. */
  now: number
}

export function useLiveProgress({ enabled, fetchHead, fetchRows }: Options): LiveProgress {
  const [rows, setRows]       = useState<ProgressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [live, setLive]       = useState(true)
  const [now, setNow]         = useState(() => Date.now())

  const headRef       = useRef<ResultsHead | null>(null)
  const lastChangeRef = useRef<number>(Date.now())

  const resume = useCallback(() => {
    lastChangeRef.current = Date.now()
    setLive(true)
  }, [])

  // First load: rows, then the probe baseline.
  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    ;(async () => {
      try {
        const first = await fetchRows()
        if (cancelled) return
        setRows(first)
        // Seeded from the SERVER, not derived from the rows: an attempt by
        // someone who has since left the class counts in the head but has no
        // row, which would otherwise read as a change for ever.
        headRef.current = await fetchHead()
      } catch {
        // Leave the rows empty; the poll below will try again.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [enabled, fetchHead, fetchRows])

  // Poll while the tab is visible.
  useEffect(() => {
    if (!enabled || !live) return
    let cancelled = false

    async function probe() {
      if (cancelled || document.visibilityState === 'hidden') return
      try {
        const head = await fetchHead()
        if (cancelled) return
        if (headChanged(headRef.current, head)) {
          headRef.current = head
          lastChangeRef.current = Date.now()
          setRows(await fetchRows())
        } else if (shouldPause(lastChangeRef.current)) {
          setLive(false)
        }
        if (!cancelled) setNow(Date.now())
      } catch {
        // A failed probe isn't worth interrupting a lesson for — the next one
        // retries, and the rows on screen are still the last good ones.
      }
    }

    const timer = setInterval(probe, POLL_MS)
    // Catch up at once when the teacher comes back to the tab.
    const onVisibility = () => { if (document.visibilityState === 'visible') probe() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, live, fetchHead, fetchRows])

  return { rows, loading, live, resume, now }
}
