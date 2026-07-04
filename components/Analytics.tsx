'use client'

/**
 * Auto-tracks a page_view event on every navigation.
 * Drop this into the root layout — it never renders any DOM.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent, captureAttribution } from '../lib/analytics'
import { titleForPath, normalizePath } from '../lib/pageTitles'

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Set the tab title from our central map, since most pages are client
    // components and can't export Next metadata. Sent to GA4 as an explicit
    // page_title too, so the analytics report is right regardless of tab timing.
    const title = titleForPath(pathname)
    document.title = title

    // First-touch campaign capture (idempotent — first hit of the session wins),
    // so the landing utm_*/gclid is recorded before the page_view fires.
    captureAttribution()
    // Send the normalised route, never the raw path — a parent-pay token in
    // `/pay/<token>` must not land in GA4 or analytics_events.
    trackEvent('page_view', { path: normalizePath(pathname), page_title: title })
  }, [pathname])

  return null
}
