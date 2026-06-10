'use client'

import { useState, ReactNode } from 'react'
import { colors, font, radius, card } from '../../lib/styles'

type Props = {
  title: string
  storageKey: string
  summary?: string
  defaultOpen?: boolean
  required?: boolean
  children: ReactNode
}

export default function CollapsibleCard({
  title,
  storageKey,
  summary,
  defaultOpen = true,
  required = false,
  children,
}: Props) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen
    const stored = sessionStorage.getItem(`qf-open-${storageKey}`)
    return stored !== null ? stored === 'true' : defaultOpen
  })

  function toggle() {
    setOpen(prev => {
      const next = !prev
      try { sessionStorage.setItem(`qf-open-${storageKey}`, String(next)) } catch {}
      return next
    })
  }

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: open ? '16px' : 0 }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left' as const,
          gap: '12px',
        }}
      >
        <span style={{ fontSize: font.lg, fontWeight: '600', color: colors.textPrimary }}>
          {title}
          {required && (
            <span style={{ color: colors.dangerText, marginLeft: '4px', fontWeight: '400', fontSize: font.base }}>
              *
            </span>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {!open && summary && (
            <span style={{
              fontSize: font.sm,
              color: colors.textSecondary,
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}>
              {summary}
            </span>
          )}
          <span style={{
            fontSize: '11px',
            color: colors.textSecondary,
            display: 'inline-block',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.15s ease',
            lineHeight: 1,
            userSelect: 'none' as const,
          }}>
            ▾
          </span>
        </div>
      </button>
      {open && children}
    </div>
  )
}
