import { describe, it, expect } from 'vitest'
import {
  computeSkillUnion, defaultKindForSkills, totalMarks, emptyPart, normalizePart,
  emptyBlank, nextBlankLabel, blankMarksTotal, normalizeBlank,
  emptyGrid, normalizeGrid, gridMarksTotal,
} from './parts'

describe('computeSkillUnion', () => {
  it('dedupes and preserves first-seen order', () => {
    expect(computeSkillUnion([
      { skill_ids: ['a', 'b'] },
      { skill_ids: ['b', 'c'] },
      { skill_ids: ['a'] },
    ])).toEqual(['a', 'b', 'c'])
  })
  it('returns [] for no parts / empty skills', () => {
    expect(computeSkillUnion([])).toEqual([])
    expect(computeSkillUnion([{ skill_ids: [] }])).toEqual([])
  })
})

describe('defaultKindForSkills', () => {
  it('one skill → mastery, several → exam, none → mastery', () => {
    expect(defaultKindForSkills(['a'])).toBe('mastery')
    expect(defaultKindForSkills(['a', 'b'])).toBe('exam')
    expect(defaultKindForSkills([])).toBe('mastery')
  })
})

describe('totalMarks', () => {
  it('sums part marks, treating falsy marks as 0', () => {
    expect(totalMarks([{ ...emptyPart(), marks: 2 }, { ...emptyPart(), marks: 3 }])).toBe(5)
    expect(totalMarks([{ ...emptyPart(), marks: 0 as any }])).toBe(0)
  })
})

describe('normalizePart', () => {
  it('keeps a numeric tolerance only for numeric answers, null otherwise', () => {
    expect(normalizePart({ ...emptyPart(), answer_type: 'numeric', tolerance: '0.5' }).tolerance).toBe(0.5)
    expect(normalizePart({ ...emptyPart(), answer_type: 'numeric', tolerance: '' }).tolerance).toBe(0)
    expect(normalizePart({ ...emptyPart(), answer_type: 'exact', tolerance: '0.5' }).tolerance).toBeNull()
  })
  it('drops wholly-empty trap rows', () => {
    const out = normalizePart({
      ...emptyPart(),
      traps: [
        { answer_template: '', response: 'x' },
        { answer_template: '{{a}}', response: 'real' },
      ],
    })
    expect(out.traps).toHaveLength(1)
    expect(out.traps[0].response).toBe('real')
  })
  it('defaults blank marks to 1 and empty explanation to null', () => {
    const out = normalizePart({ ...emptyPart(), marks: '', explanation: '   ' })
    expect(out.marks).toBe(1)
    expect(out.explanation).toBeNull()
  })
  it('defaults a missing requires_simplest to false (lenient)', () => {
    const out = normalizePart({ ...emptyPart(), requires_simplest: undefined as any })
    expect(out.requires_simplest).toBe(false)
  })
  it('never emits a blanks key for scalar parts (clean stored jsonb)', () => {
    const out = normalizePart({ ...emptyPart(), answer_type: 'numeric' })
    expect('blanks' in out).toBe(false)
  })
})

describe('nextBlankLabel', () => {
  it('returns the first unused letter A..Z', () => {
    expect(nextBlankLabel([])).toBe('A')
    expect(nextBlankLabel([{ label: 'A' }, { label: 'B' }])).toBe('C')
    expect(nextBlankLabel([{ label: 'A' }, { label: 'C' }])).toBe('B')
  })
  it('is case/whitespace tolerant', () => {
    expect(nextBlankLabel([{ label: ' a ' }])).toBe('B')
  })
})

describe('normalizeBlank', () => {
  it('coerces tolerance for numeric, nulls it otherwise', () => {
    expect(normalizeBlank({ ...emptyBlank('A'), answer_type: 'numeric', tolerance: '0.5' }).tolerance).toBe(0.5)
    expect(normalizeBlank({ ...emptyBlank('A'), answer_type: 'numeric', tolerance: '' }).tolerance).toBe(0)
    expect(normalizeBlank({ ...emptyBlank('A'), answer_type: 'exact', tolerance: '0.5' }).tolerance).toBeNull()
  })
  it('keeps a non-empty prompt and omits the key when blank', () => {
    expect(normalizeBlank({ ...emptyBlank('A'), prompt: 'Bus students' }).prompt).toBe('Bus students')
    expect('prompt' in normalizeBlank({ ...emptyBlank('A'), prompt: '  ' })).toBe(false)
    expect('prompt' in normalizeBlank(emptyBlank('A'))).toBe(false)
  })
  it('drops empty trap rows, defaults marks to 1, trims the label', () => {
    const out = normalizeBlank({
      ...emptyBlank(' A '),
      marks: '',
      traps: [
        { answer_template: '', response: 'x' },
        { answer_template: '{{a+1}}', response: 'off by one' },
      ],
    })
    expect(out.label).toBe('A')
    expect(out.marks).toBe(1)
    expect(out.traps).toHaveLength(1)
  })
})

describe('normalizePart (multi_blank)', () => {
  const multiBlankInput = () => ({
    ...emptyPart(),
    answer_type: 'multi_blank' as const,
    // Stale scalar state that must be blanked on normalise:
    answer_template: '{{stale}}',
    tolerance: '0.5',
    requires_simplest: true,
    traps: [{ answer_template: '{{stale}}', response: 'stale trap' }],
    marks: '99', // must be ignored — computed from blanks
    blanks: [
      { ...emptyBlank('A'), answer_template: '{{a}}', marks: 1 },
      { ...emptyBlank('B'), answer_template: '{{a+b}}', marks: '2' as const },
    ],
  })

  it('blanks the part-level answer fields and normalises blanks', () => {
    const out = normalizePart(multiBlankInput())
    expect(out.answer_template).toBe('')
    expect(out.tolerance).toBeNull()
    expect(out.requires_simplest).toBe(false)
    expect(out.traps).toEqual([])
    expect(out.blanks).toHaveLength(2)
    expect(out.blanks![1].marks).toBe(2)
  })
  it('computes marks as the blank sum, never trusting the form value', () => {
    expect(normalizePart(multiBlankInput()).marks).toBe(3)
  })
  it('totalMarks counts a multi_blank part at its blank sum', () => {
    const part = normalizePart(multiBlankInput())
    expect(totalMarks([part, { ...emptyPart(), marks: 2 }])).toBe(5)
  })
})

describe('blankMarksTotal', () => {
  it('sums, treating falsy as 0', () => {
    expect(blankMarksTotal([{ marks: 1 }, { marks: 2 }])).toBe(3)
    expect(blankMarksTotal([])).toBe(0)
  })
})

describe('normalizeGrid', () => {
  it('stores numeric strings as numbers and keeps templates as strings', () => {
    const g = normalizeGrid({
      ...emptyGrid(),
      x: { min: '0', max: '{{xmax}}', step: '2', label: 'x' },
      elements: [{ x: '4', y: '{{4*m + c}}', marks: 1 }],
    })
    expect(g.x.min).toBe(0)
    expect(g.x.max).toBe('{{xmax}}')
    expect(g.x.step).toBe(2)
    expect(g.elements[0].x).toBe(4)
    expect(g.elements[0].y).toBe('{{4*m + c}}')
  })
  it('defaults step to 1, marks to 1, tolerance to 0; drops empty element rows', () => {
    const g = normalizeGrid({
      ...emptyGrid(),
      x: { min: '0', max: '5', step: '', label: '' },
      elements: [
        { x: '', y: '', marks: 1 },        // wholly empty → dropped
        { x: '1', y: '2', marks: '' },     // marks defaults
      ],
      tolerance: '',
    })
    expect(g.x.step).toBe(1)
    expect(g.elements).toHaveLength(1)
    expect(g.elements[0].marks).toBe(1)
    expect(g.tolerance).toBe(0)
  })
})

describe('normalizeGrid (traps)', () => {
  it('coerces trap coordinates and keeps templates', () => {
    const g = normalizeGrid({
      ...emptyGrid(),
      traps: [{ elements: [{ x: '3', y: '{{c}}' }], response: 'Wrong centre.' }],
    })
    expect(g.traps).toHaveLength(1)
    expect(g.traps![0].elements[0]).toEqual({ x: 3, y: '{{c}}' })
  })
  it('drops traps with no elements or no response, and omits the key when none survive', () => {
    const g = normalizeGrid({
      ...emptyGrid(),
      traps: [
        { elements: [{ x: '', y: '' }], response: 'no coords' },   // dropped
        { elements: [{ x: '1', y: '2' }], response: '   ' },       // dropped
      ],
    })
    expect('traps' in g).toBe(false)
  })
  it('omits the traps key entirely when none are authored', () => {
    expect('traps' in normalizeGrid(emptyGrid())).toBe(false)
  })
})

describe('normalizePart (grid_draw)', () => {
  const gridInput = () => ({
    ...emptyPart(),
    answer_type: 'grid_draw' as const,
    // Stale scalar state that must be blanked:
    answer_template: '{{stale}}',
    tolerance: '0.5',
    requires_simplest: true,
    traps: [{ answer_template: '{{stale}}', response: 'stale trap' }],
    marks: '99', // ignored — computed from elements
    grid: {
      ...emptyGrid(),
      mode: 'line' as const,
      elements: [
        { x: '0', y: '{{c}}', marks: 1 },
        { x: '4', y: '{{4*m + c}}', marks: '2' as const },
      ],
    },
  })

  it('blanks the scalar answer fields and normalises the grid', () => {
    const out = normalizePart(gridInput())
    expect(out.answer_template).toBe('')
    expect(out.tolerance).toBeNull()
    expect(out.requires_simplest).toBe(false)
    expect(out.traps).toEqual([]) // no traps on grid_draw in v1
    expect(out.grid!.mode).toBe('line')
    expect(out.grid!.elements).toHaveLength(2)
    expect(out.grid!.elements[1].marks).toBe(2)
  })
  it('computes marks as the element sum, never trusting the form value', () => {
    expect(normalizePart(gridInput()).marks).toBe(3)
  })
  it('scalar and multi_blank parts never emit a grid key', () => {
    expect('grid' in normalizePart({ ...emptyPart(), answer_type: 'numeric' })).toBe(false)
    expect('grid' in normalizePart({
      ...emptyPart(), answer_type: 'multi_blank',
      blanks: [{ ...emptyBlank('A'), answer_template: '{{a}}' }],
    })).toBe(false)
  })
})

describe('gridMarksTotal', () => {
  it('sums, treating falsy as 0', () => {
    expect(gridMarksTotal([{ marks: 1 }, { marks: 2 }])).toBe(3)
    expect(gridMarksTotal([])).toBe(0)
  })
})
