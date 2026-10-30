'use client'

/**
 * Who is signed in — for the site chrome, not for access control.
 *
 * WHY THIS EXISTS. Every public page wrote its own header, and none of them
 * asked whether anyone was signed in: the landing page offered "Log in" to a
 * student who was already logged in, and /for-teachers offered "Teacher login"
 * to the teacher reading it. The pages that DO know (practice, /skill/[slug],
 * the dashboards) each resolve auth their own way, so there was nowhere to put
 * the answer once.
 *
 * It is deliberately CHEAP, because it runs on a statically-served marketing
 * page where auth can only be resolved after hydration:
 *   - getSession() reads the JWT out of localStorage; no network round-trip.
 *   - a student's role is already in their auth metadata (both signup paths
 *     set it — see signUpStudent and the OAuth provision route), so the common
 *     case costs nothing at all.
 *   - a teacher carries no role in metadata (deliberately: handle_new_user
 *     keys off its absence), so that case falls back to one cached lookup per
 *     browser session (getCachedAccountRole).
 *
 * `loading` is kept separate from `signedOut` rather than folded into it,
 * because what to draw while the answer is pending is the caller’s decision
 * and it is not the same everywhere — see the note in SiteNav for why the
 * public pages deliberately draw the two alike, which a dashboard should not.
 */

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { getCachedAccountRole } from './auth'

/** 'unknown' = there IS a session, but which kind of account it is didn't resolve. */
export type NavRole = 'teacher' | 'student' | 'unknown'

export type NavAccount =
  | { state: 'loading' }
  | { state: 'signedOut' }
  | { state: 'signedIn'; role: NavRole; displayName: string | null }

/**
 * Where "my dashboard" goes for each role.
 *
 * 'unknown' goes to /account rather than guessing a dashboard: that page
 * serves both roles and resolves which one at runtime, so it is the one
 * destination that cannot be wrong.
 */
export function dashboardPath(role: NavRole): string {
  if (role === 'teacher') return '/dashboard'
  if (role === 'student') return '/student/dashboard'
  return '/account'
}

async function resolveAccount(session: Session | null): Promise<NavAccount> {
  const user = session?.user
  if (!user) return { state: 'signedOut' }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const name = typeof meta.display_name === 'string' ? meta.display_name.trim() : ''
  const displayName = name || null

  // Students are identifiable from the token alone — no query.
  if (meta.role === 'student') return { state: 'signedIn', role: 'student', displayName }

  const role = await getCachedAccountRole(user.id)
  return {
    state: 'signedIn',
    role: role === 'teacher' || role === 'student' ? role : 'unknown',
    displayName,
  }
}

export function useAccountNav(): NavAccount {
  const [account, setAccount] = useState<NavAccount>({ state: 'loading' })

  useEffect(() => {
    let cancelled = false
    const apply = (session: Session | null) => {
      resolveAccount(session)
        .then(next => { if (!cancelled) setAccount(next) })
        // A failed lookup must not leave the nav stuck on `loading` with an
        // empty slot: fall back to the signed-out chrome, which is at least
        // usable.
        .catch(() => { if (!cancelled) setAccount({ state: 'signedOut' }) })
    }

    supabase.auth.getSession().then(({ data: { session } }) => apply(session))

    // Keeps the nav honest after a sign-out in another tab, and after a
    // sign-in that happened without a full page load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => apply(session))

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return account
}
