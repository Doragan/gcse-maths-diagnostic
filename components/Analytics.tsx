'use client'

/**
 * Auto-tracks a page_view event on every navigation.
 * Drop this into the root layout — it never renders any DOM.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    trackEvent('page_view', { path: pathname })
  }, [pathname])

  return null
}
