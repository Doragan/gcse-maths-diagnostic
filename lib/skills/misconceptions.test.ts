import { describe, it, expect } from 'vitest'
import { misconceptions, misconceptionsById, getMisconception } from '../../data/misconceptions'

// ─────────────────────────────────────────────────────────────────────────────
// The registry is only useful if every id in the bank resolves to an entry.
// A typo'd or invented id degrades silently — the trap still fires and the
// student still gets their explanation — so nothing surfaces the problem
// except a count that quietly never adds up. These assertions are that surface.
//
// The bank itself is checked by scripts/audit-misconceptions.ts, which needs a
// database. What can be checked without one is the registry's own integrity.
// ─────────────────────────────────────────────────────────────────────────────

describe('misconception registry', () => {
  it('has no duplicate ids', () => {
    const ids = misconceptions.map(m => m.id)
    expect(ids.length).toBe(new Set(ids).size)
  })

  it('uses snake_case ids, so they read the same as skill and trap ids', () => {
    for (const m of misconceptions) {
      expect(m.id, `${m.id} is not snake_case`).toMatch(/^[a-z][a-z0-9_]*$/)
    }
  })

  it('gives every entry a teacher-facing name and a description', () => {
    for (const m of misconceptions) {
      expect(m.name?.trim(), `${m.id} has no name`).toBeTruthy()
      expect(m.description?.trim(), `${m.id} has no description`).toBeTruthy()
      // The name is shown in class-level views as a diagnosis, not a label —
      // "Divided the wrong way round", not "div_wrong".
      expect(m.name.length, `${m.id}: name reads like an id, not a diagnosis`).toBeGreaterThan(8)
    }
  })

  it('stays small enough to be a taxonomy rather than a tally', () => {
    // The whole point is a SHARED vocabulary. The exam audit has 1,281 labels
    // of which 79% appear once; that is what this must not become. If this
    // assertion starts failing, the question is whether the new entries really
    // recur across skills — not whether to raise the number.
    expect(misconceptions.length).toBeLessThanOrEqual(40)
  })

  it('resolves ids and tolerates an untagged trap', () => {
    expect(getMisconception('divided_the_wrong_way_round')?.name).toBe('Divided the wrong way round')
    expect(misconceptionsById['ratio_order_reversed']).toBeDefined()
    // Untagged is normal, not an error.
    expect(getMisconception(null)).toBeNull()
    expect(getMisconception(undefined)).toBeNull()
    expect(getMisconception('')).toBeNull()
    // An id that does not resolve returns null rather than throwing.
    expect(getMisconception('not_a_real_misconception')).toBeNull()
  })
})
