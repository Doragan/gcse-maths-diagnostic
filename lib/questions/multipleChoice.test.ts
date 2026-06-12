import { describe, it, expect } from 'vitest'
import { buildOptions, cleanMcOptions, renderMcOptions } from './multipleChoice'

describe('buildOptions — explicit author options', () => {
  it('uses 2+ explicit options verbatim (set-equal, order ignored)', () => {
    const opts = buildOptions('Some', [], ['All', 'Some', 'No'])
    expect(new Set(opts)).toEqual(new Set(['All', 'Some', 'No']))
  })
  it('prepends the correct answer if the explicit list omits it', () => {
    const opts = buildOptions('Some', [], ['All', 'No'])
    expect(opts).toContain('Some')
    expect(opts).toHaveLength(3)
  })
})

describe('buildOptions — derived distractors', () => {
  it('combines correct + trap answers, excluding traps equal to the answer', () => {
    const opts = buildOptions('12', [{ answer: '7' }, { answer: '9' }, { answer: '12' }], null)
    expect(opts).toContain('12')
    expect(opts).toContain('7')
    expect(opts).toContain('9')
    expect(opts.filter(o => o === '12')).toHaveLength(1) // the answer-equal trap didn't duplicate
  })
  it('pads numeric answers up to 4 options with near-misses', () => {
    const opts = buildOptions('10', [], null)
    expect(opts).toHaveLength(4)
    expect(opts).toContain('10')
    expect(new Set(opts).size).toBe(4) // all distinct
  })
  it('dedupes options that are value-equal but differently formatted (L6)', () => {
    // A trap that renders equal-in-value to the answer must not appear twice.
    const opts = buildOptions('12', [{ answer: '12' }, { answer: '7' }, { answer: '12 ' }], null)
    const values = opts.map(o => o.trim())
    expect(values.filter(v => v === '12')).toHaveLength(1)
  })
})

describe('cleanMcOptions', () => {
  const base = { question_type: 'multiple_choice' as const }
  it('returns null for multi-part or non-MC questions', () => {
    expect(cleanMcOptions(true, { ...base, mc_options: ['a', 'b'] })).toBeNull()
    expect(cleanMcOptions(false, { question_type: 'numeric', mc_options: ['a', 'b'] })).toBeNull()
  })
  it('trims + drops empties, returning the array only when 2+ remain', () => {
    expect(cleanMcOptions(false, { ...base, mc_options: [' a ', '', 'b'] })).toEqual(['a', 'b'])
    expect(cleanMcOptions(false, { ...base, mc_options: ['a', '   '] })).toBeNull()
    expect(cleanMcOptions(false, { ...base, mc_options: null })).toBeNull()
  })
})

describe('renderMcOptions', () => {
  it('renders templates against values, null when fewer than 2 survive', () => {
    expect(renderMcOptions(['{{a}}', '{{a+1}}'], { a: 3 })).toEqual(['3', '4'])
    expect(renderMcOptions(null, { a: 3 })).toBeNull()
    expect(renderMcOptions([], { a: 3 })).toBeNull()
    expect(renderMcOptions(['{{a}}'], { a: 3 })).toBeNull()
  })
})
