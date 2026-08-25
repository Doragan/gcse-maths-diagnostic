'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent, getSessionId } from '../../lib/analytics'
import {
  colors, font, radius,
  pageContainer, narrowCard, pageTitle,
  primaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'

const ROLES = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'tutor',   label: 'Tutor' },
  { id: 'parent',  label: 'Parent' },
  { id: 'student', label: 'Student' },
  { id: 'other',   label: 'Other' },
] as const

function ContactForm() {
  const params = useSearchParams()
  const from = params.get('from') || 'direct'

  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [sent, setSent]       = useState(false)

  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && message.trim()

  async function handleSubmit() {
    if (!valid || loading) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: role || null,
          message: message.trim(),
          from,
          sessionId: getSessionId(),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'Something went wrong — please try again.')
      trackEvent('contact_submitted', { from, role: role || 'unspecified' })
      setSent(true)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Thanks — that's sent</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
            I read every message myself and reply personally, usually within a day or two.
          </p>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={primaryButton}>Back to Mathsense</button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={pageContainer}>
      <div style={narrowCard}>
        <div>
          <h1 style={pageTitle}>Get in touch</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0', lineHeight: 1.6 }}>
            Questions, feedback, or interested in using Mathsense with your students? Send a
            message and I'll reply from a real inbox.
          </p>
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@school.ac.uk"
            autoComplete="email"
          />
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>I am a… <span style={{ color: colors.textHint, fontWeight: '400' }}>(optional)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
            {ROLES.map(r => {
              const selected = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(selected ? '' : r.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: radius.full,
                    border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                    background: selected ? '#eff6ff' : colors.card,
                    color: selected ? colors.primary : colors.textSecondary,
                    fontSize: font.sm,
                    fontWeight: selected ? '600' : '400',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
          />
        </div>

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!valid || loading}
          style={{ ...primaryButton, opacity: !valid || loading ? 0.6 : 1 }}
        >
          {loading ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </main>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<main style={pageContainer} />}>
      <ContactForm />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
}
