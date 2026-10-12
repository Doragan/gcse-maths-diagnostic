import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getQualification, setQualification, qualificationLabel,
  QUALIFICATIONS, DEFAULT_QUALIFICATION,
} from './qualificationPreference'
import { getBoard } from './boardPreference'
import { codedBoards } from './examProfile'
import {
  calculatorFiltersFor, getCalculatorFilter, setCalculatorFilter,
} from '../questions/calculatorPreference'
import { courseFor, higherOnlySkillsFor, BOARDS_BY_QUALIFICATION, type Qualification } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// Qualification is the widest study preference: it decides the skill pool, the
// courses and which boards exist for this student. A bad value here does not
// show a wrong number, it shows the wrong curriculum — so the guard on the way
// IN is what matters, exactly as in boardPreference.
// ─────────────────────────────────────────────────────────────────────────────

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
  })
  // calculatorPreference bridges a sessionStorage key /practice writes.
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get('s:' + k) ?? null,
    setItem: (k: string, v: string) => { store.set('s:' + k, v) },
  })
})

afterEach(() => { vi.unstubAllGlobals() })

describe('qualification preference', () => {
  it('defaults to the generic GCSE experience', () => {
    expect(getQualification()).toBe('gcse')
    expect(DEFAULT_QUALIFICATION).toBe('gcse')
  })

  it('round-trips every offered qualification', () => {
    for (const q of QUALIFICATIONS) {
      setQualification(q)
      expect(getQualification()).toBe(q)
    }
  })

  it('ignores a value that is not a qualification', () => {
    setQualification('igcse')
    // A stale or hand-edited key must not put the app on a qualification with
    // no courses behind it.
    setQualification('a-level' as Qualification)
    expect(getQualification()).toBe('igcse')
  })

  it('falls back to the default when storage holds rubbish', () => {
    store.set('mathsense_qualification', 'gcse(9-1)')
    expect(getQualification()).toBe(DEFAULT_QUALIFICATION)
  })

  it('survives storage being unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    })
    // Private browsing. The page must still render something coherent.
    expect(() => setQualification('igcse')).not.toThrow()
    expect(getQualification()).toBe(DEFAULT_QUALIFICATION)
  })

  it('offers a label for every qualification, and two distinct ones', () => {
    const labels = QUALIFICATIONS.map(qualificationLabel)
    expect(labels.every(l => l.length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(QUALIFICATIONS.length)
  })

  it('offers exactly the qualifications that have boards', () => {
    expect([...QUALIFICATIONS].sort()).toEqual(Object.keys(BOARDS_BY_QUALIFICATION).sort())
  })
})

describe('switching qualification', () => {
  it('drops a board belonging to the qualification left behind', () => {
    // The regression this scoping exists to prevent, end to end: pick a GCSE
    // board, switch to iGCSE, and the panel must NOT still be scoped to AQA.
    setQualification('gcse')
    const gcseBoard = codedBoards('gcse')[0]
    expect(getBoard('gcse')).toBeTruthy()

    const igcseBoard = getBoard('igcse')
    expect(codedBoards('igcse')).toContain(igcseBoard)
    expect(igcseBoard).not.toBe(gcseBoard)
  })

  it('keeps the earlier board when the student switches back', () => {
    // Deliberate: setQualification does not clear the stored board, because
    // getBoard already ignores one from another qualification. A student who
    // looks at iGCSE and returns should not have lost their choice.
    const other = codedBoards('gcse').find(b => b !== getBoard('gcse'))!
    store.set('mathsense_board', other)
    setQualification('igcse')
    setQualification('gcse')
    expect(getBoard('gcse')).toBe(other)
  })
})

describe('calculator filters follow the qualification', () => {
  it('offers all three on GCSE', () => {
    expect(calculatorFiltersFor('gcse')).toEqual(['mixed', 'non_calc', 'calc'])
  })

  it('never offers Non-calculator on iGCSE', () => {
    // 4MA1 has no non-calculator paper at all — every coded 4MA1 paper is a
    // calculator paper — so this is not a harder setting, it is practice for a
    // paper the student will not sit.
    expect(calculatorFiltersFor('igcse')).not.toContain('non_calc')
    expect(calculatorFiltersFor('igcse').length).toBeGreaterThan(0)
  })

  it('drops a stored Non-calculator filter after a switch to iGCSE', () => {
    // The filter outlives the switch in localStorage, and the question page
    // reads it directly to build its pool — so the coercion has to be in
    // getCalculatorFilter, not only in the toggle.
    setQualification('gcse')
    setCalculatorFilter('non_calc')
    expect(getCalculatorFilter()).toBe('non_calc')

    setQualification('igcse')
    expect(getCalculatorFilter()).toBe('mixed')
  })

  it('leaves a Calculator filter alone on iGCSE', () => {
    setQualification('igcse')
    setCalculatorFilter('calc')
    expect(getCalculatorFilter()).toBe('calc')
  })
})

describe('course resolution', () => {
  it('resolves a Foundation and a Higher course for every qualification', () => {
    for (const q of QUALIFICATIONS) {
      for (const tier of ['foundation', 'higher'] as const) {
        const c = courseFor(q, tier)
        expect(c.qualification, `${q} ${tier}`).toBe(q)
        expect(c.skills.length, `${q} ${tier}`).toBeGreaterThan(0)
      }
    }
  })

  it('makes Higher a superset of Foundation, within a qualification', () => {
    for (const q of QUALIFICATIONS) {
      const f = courseFor(q, 'foundation').skills
      const h = new Set(courseFor(q, 'higher').skills)
      expect(f.filter(id => !h.has(id)), `${q} Foundation skills missing from Higher`).toEqual([])
    }
  })

  it('keeps the higher-only pool disjoint from Foundation', () => {
    // /practice drills this pool for a Higher session, so a Foundation skill
    // leaking in would quietly make Higher practice easier than it should be.
    for (const q of QUALIFICATIONS) {
      const f = new Set(courseFor(q, 'foundation').skills)
      const only = higherOnlySkillsFor(q)
      expect(only.filter(id => f.has(id)), `${q}`).toEqual([])
      expect(only.length, `${q} has no higher-only content`).toBeGreaterThan(0)
    }
  })

  it('rebuilds the Higher course from Foundation plus higher-only', () => {
    for (const q of QUALIFICATIONS) {
      const rebuilt = [...courseFor(q, 'foundation').skills, ...higherOnlySkillsFor(q)]
      expect([...rebuilt].sort(), `${q}`).toEqual([...courseFor(q, 'higher').skills].sort())
    }
  })
})
