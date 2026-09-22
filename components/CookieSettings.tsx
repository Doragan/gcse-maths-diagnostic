'use client'

import { useEffect, useState } from 'react'
import { trackEvent } from '../lib/analytics'
import {
  readConsent,
  writeConsent,
  loadGA,
  disableGA,
  type ConsentState,
} from '../lib/cookieConsent'

/**
 * The analytics choice, changeable at any time.
 *
 * WHY IT LIVES ON THE PRIVACY PAGE rather than in Account settings: anyone can
 * accept the banner, including a visitor who never signs up, and a control that
 * required an account would leave exactly those people with no way back. The
 * privacy notice is public and is linked from the footer of every page, so it
 * is reachable by everyone who could have consented. The email announcing the
 * change points here for the same reason.
 *
 * Renders nothing until the stored value has been read, because the server has
 * no way to know the choice and a flash of the wrong state reads as the setting
 * having changed by itself.
 */
export default function CookieSettings() {
  const [state, setState] = useState<ConsentState>('undecided')
  const [ready, setReady] = useState(false)
  const [justChanged, setJustChanged] = useState(false)

  useEffect(() => {
    setState(readConsent())
    setReady(true)
  }, [])

  function choose(next: 'accepted' | 'declined') {
    writeConsent(next)
    setState(next)
    setJustChanged(true)
    if (next === 'accepted') {
      loadGA()
      // After loadGA, so the event that records the change also reaches GA.
      trackEvent('cookie_consent', { decision: 'accept', source: 'settings' })
    } else {
      // Recorded BEFORE disabling, so the withdrawal itself is still counted in
      // our own store. It never reaches Google either way: this fires into
      // Supabase, and disableGA stops anything further.
      trackEvent('cookie_consent', { decision: 'decline', source: 'settings' })
      disableGA()
    }
  }

  if (!ready) return <div style={{ minHeight: '96px' }} />

  const accepted = state === 'accepted'

  return (
    <div style={styles.box}>
      <p style={styles.status}>
        {state === 'accepted' && 'Analytics cookies are on. Usage data is being sent to Google.'}
        {state === 'declined' && 'Analytics cookies are off. Nothing is being sent to Google.'}
        {state === 'undecided' && 'You have not made a choice yet. Nothing is being sent to Google.'}
      </p>

      <div style={styles.row}>
        <button
          onClick={() => choose('accepted')}
          disabled={accepted}
          style={{ ...styles.button, ...(accepted ? styles.current : styles.idle) }}
        >
          {accepted ? 'On' : 'Turn on'}
        </button>
        <button
          onClick={() => choose('declined')}
          disabled={state === 'declined'}
          style={{
            ...styles.button,
            ...(state === 'declined' ? styles.current : styles.idle),
          }}
        >
          {state === 'declined' ? 'Off' : 'Turn off'}
        </button>
      </div>

      {justChanged && (
        <p style={styles.confirm}>
          Saved. {accepted
            ? 'Analytics is on from now on.'
            : 'Analytics is off, and the cookies Google had set have been deleted.'}
        </p>
      )}

      <p style={styles.note}>
        Turning this off does not limit anything you can do on Mathsense.
      </p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '16px',
    background: '#fafafa',
    margin: '8px 0',
  },
  status: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.7',
    margin: '0 0 12px',
    fontWeight: 600,
  },
  row: { display: 'flex', gap: '10px' },
  button: {
    flex: '0 0 auto',
    minWidth: '110px',
    padding: '9px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
  },
  idle: {
    border: '1px solid #1976d2',
    background: 'white',
    color: '#1976d2',
    cursor: 'pointer',
  },
  // The current choice is shown as selected rather than hidden, so the state is
  // legible without having to press anything to find out.
  current: {
    border: '1px solid #9ca3af',
    background: '#e5e7eb',
    color: '#4b5563',
    cursor: 'default',
  },
  confirm: {
    fontSize: '14px',
    color: '#166534',
    lineHeight: '1.7',
    margin: '12px 0 0',
  },
  note: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: '10px 0 0',
  },
}
