import { describe, it, expect } from 'vitest'
import { skills } from '../../data/skills'

// ─────────────────────────────────────────────────────────────────────────────
// Skill names are DISPLAY strings. Nothing looks a skill up by name — the id is
// the key everywhere — so these are safe to correct, and they surface in a lot
// of places: the briefing heading, /skills, the dashboard topic map, the
// practice pickers, the teacher's assignment browser.
//
// The house style is title case with lowercase minor words: "Fractions of
// Amounts", "Irregular and Improper Fractions". 155 of the 159 names followed
// it; four did not, which showed up as "Angles on lines and Circles" in a
// briefing heading.
//
// This test is here so the next name added follows the same style, rather than
// the tidy being done once and drifting again.
// ─────────────────────────────────────────────────────────────────────────────

/** Words that stay lowercase inside a title. */
const MINOR = new Set([
  'of', 'and', 'a', 'an', 'the', 'to', 'on', 'in', 'with', 'for', 'from', 'by', 'into', 'at',
])

/**
 * Tokens that are lowercase because the MATHS says so, not because of style.
 * "nth term" is written that way in every mark scheme, and a formula in
 * brackets is a formula.
 */
const MATHS = new Set(['nth', 'sinc', '½ab'])

const words = (name: string) => name.split(/\s+/).filter(Boolean)

/** A word stripped of the punctuation a title carries: brackets, colons. */
const bare = (word: string) => word.replace(/^[("']+|[)"':,]+$/g, '')

describe('skill names', () => {
  it('starts every name with a capital', () => {
    const bad = skills.filter(s => !/^[A-Z0-9]/.test(s.name)).map(s => s.name)
    expect(bad, 'names not starting with a capital').toEqual([])
  })

  it('capitalises every word except minor words and maths tokens', () => {
    const bad: string[] = []
    for (const s of skills) {
      words(s.name).forEach((w, i) => {
        const token = bare(w)
        if (!token || !/^[a-z]/.test(token)) return
        if (MATHS.has(token.toLowerCase())) return
        // A minor word is fine anywhere except as the first word.
        if (i > 0 && MINOR.has(token.toLowerCase())) return
        bad.push(`${s.id}: "${s.name}" — "${token}"`)
      })
    }
    expect(bad, 'names with an uncapitalised word').toEqual([])
  })

  it('has no name with leading, trailing or doubled spaces', () => {
    const bad = skills.filter(s => s.name !== s.name.trim() || /\s{2,}/.test(s.name)).map(s => s.id)
    expect(bad, 'names with stray whitespace').toEqual([])
  })

  it('never gives two skills the same name', () => {
    // Two identical names in a picker are indistinguishable to whoever is using it.
    const seen = new Map<string, string>()
    const clashes: string[] = []
    for (const s of skills) {
      const key = s.name.toLowerCase()
      const first = seen.get(key)
      if (first) clashes.push(`${first} and ${s.id} are both "${s.name}"`)
      else seen.set(key, s.id)
    }
    expect(clashes, 'duplicate skill names').toEqual([])
  })
})
