'use client'

import { useState, useRef, useEffect } from 'react'
import { colors, font, radius, inputStyle } from '../../lib/styles'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
}

type SymbolButton = {
  label: string
  insert: string
  display: string
}

const SYMBOL_GROUPS: { title: string, buttons: SymbolButton[] }[] = [
  {
    title: 'Powers & Roots',
    buttons: [
      { label: 'x²', insert: '^2', display: 'x²' },
      { label: 'x³', insert: '^3', display: 'x³' },
      { label: 'xⁿ', insert: '^', display: 'xⁿ' },
      { label: '√', insert: 'sqrt(', display: '√' },
      { label: '∛', insert: 'cbrt(', display: '∛' },
    ],
  },
  {
    title: 'Operations',
    buttons: [
      { label: '×', insert: '*', display: '×' },
      { label: '÷', insert: '/', display: '÷' },
      { label: '±', insert: '±', display: '±' },
      { label: 'π', insert: 'pi', display: 'π' },
    ],
  },
  {
    title: 'Inequalities',
    buttons: [
      { label: '≤', insert: '<=', display: '≤' },
      { label: '≥', insert: '>=', display: '≥' },
      { label: '≠', insert: '!=', display: '≠' },
    ],
  },
]

// Convert plain text input to LaTeX for preview
function toLatex(input: string): string {
  return input
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/\^([a-zA-Z])/g, '^{$1}')
    .replace(/sqrt\(([^)]*)\)/g, '\\sqrt{$1}')
    .replace(/cbrt\(([^)]*)\)/g, '\\sqrt[3]{$1}')
    .replace(/\*/g, '\\times ')
    .replace(/pi/g, '\\pi ')
    .replace(/<=/g, '\\leq ')
    .replace(/>=/g, '\\geq ')
    .replace(/!=/g, '\\neq ')
    .replace(/±/g, '\\pm ')
}

export default function MathInput({ value, onChange, onSubmit, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [katex, setKatex] = useState<any>(null)
  const [previewHtml, setPreviewHtml] = useState('')

  useEffect(() => {
    // Load KaTeX dynamically
    import('katex').then(k => setKatex(k.default))
  }, [])

  useEffect(() => {
    if (!katex || !value.trim()) {
      setPreviewHtml('')
      return
    }
    try {
      const latex = toLatex(value)
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      })
      setPreviewHtml(html)
    } catch {
      setPreviewHtml('')
    }
  }, [value, katex])

  function insertAtCursor(text: string) {
    const input = inputRef.current
    if (!input) {
      onChange(value + text)
      return
    }

    const start = input.selectionStart ?? value.length
    const end = input.selectionEnd ?? value.length
    const newValue = value.slice(0, start) + text + value.slice(end)
    onChange(newValue)

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(start + text.length, start + text.length)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* KaTeX stylesheet */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
      />

      {/* Live preview */}
      {value.trim() && previewHtml && (
        <div style={styles.preview}>
          <span style={{ fontSize: font.sm, color: colors.textSecondary, marginRight: '8px' }}>
            Preview:
          </span>
          <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          onFocus={() => setShowKeyboard(true)}
          style={{ ...inputStyle, flex: 1, fontSize: font.lg }}
          placeholder={placeholder ?? 'Type your answer...'}
          autoComplete="off"
          autoCapitalize="off"
        />
        <button
          onClick={() => setShowKeyboard(prev => !prev)}
          style={{
            padding: '10px 12px',
            borderRadius: radius.md,
            border: `1px solid ${colors.borderStrong}`,
            background: showKeyboard ? colors.primary : colors.card,
            color: showKeyboard ? '#ffffff' : colors.textSecondary,
            cursor: 'pointer',
            fontSize: font.lg,
            flexShrink: 0,
          }}
          title="Toggle symbol keyboard"
        >
          ∑
        </button>
      </div>

      {/* Symbol keyboard */}
      {showKeyboard && (
        <div style={styles.keyboard}>
          {SYMBOL_GROUPS.map(group => (
            <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, fontWeight: '600' }}>
                {group.title}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                {group.buttons.map(btn => (
                  <button
                    key={btn.label}
                    onClick={() => insertAtCursor(btn.insert)}
                    style={styles.symbolButton}
                    title={`Insert: ${btn.insert}`}
                  >
                    {btn.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
            Tip: type ^ for powers, e.g. x^2 for x²
          </p>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  preview: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    background: colors.background,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    fontSize: font.lg,
    minHeight: '40px',
  },
  keyboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '14px',
    background: colors.cardAlt,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  symbolButton: {
    padding: '8px 14px',
    borderRadius: radius.md,
    border: `1px solid ${colors.borderStrong}`,
    background: colors.card,
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: font.lg,
    fontWeight: '600',
    minWidth: '44px',
  },
}