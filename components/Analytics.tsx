'use client'

/**
 * Auto-tracks a page_view event on every navigation.
 * Drop this into the root layout — it never renders any DOM.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent, captureAttribution } from '../lib/analytics'

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // First-touch campaign capture (idempotent — first hit of the session wins),
    // so the landing utm_*/gclid is recorded before the page_view fires.
    captureAttribution()
    trackEvent('page_view', { path: pathname })
  }, [pathname])

  return null
}
