'use client'

/**
 * Dev mode toggle — suppresses all analytics tracking when active.
 *
 * Keyboard shortcut: Ctrl+Alt+D (works anywhere on the site).
 * State persists in localStorage across refreshes but not across devices.
 *
 * When active, a small amber badge appears in the bottom-right corner
 * so you always know tracking is off.
 */

import { useEffect, useState } from 'react'
import { isDevMode, toggleDevMode } from '../lib/analytics'

export default function DevModeToggle() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Sync initial state from localStorage
    setActive(isDevMode())

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        const next = toggleDevMode()
        setActive(next)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!active) return null

  return (
    <div
      title="Press Ctrl+Alt+D to disable dev mode and resume tracking"
      style={{
        position:       'fixed',
        bottom:         16,
        right:          16,
        zIndex:         9999,
        background:     '#fef3c7',
        border:         '1px solid #f59e0b',
        borderRadius:   8,
        padding:        '5px 12px',
        fontSize:       12,
        fontWeight:     600,
        color:          '#92400e',
        letterSpacing:  '0.01em',
        userSelect:     'none',
        pointerEvents:  'none',
        boxShadow:      '0 1px 4px rgba(0,0,0,0.12)',
      }}
    >
      🔇 Dev mode · analytics off
    </div>
  )
}
