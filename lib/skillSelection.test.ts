import { describe, it, expect } from 'vitest'
import { addAll, removeAll, toggleOne, allChosen, skillSetLabel } from './skillSelection'

const ALGEBRA = ['solving_linear', 'expanding', 'factorising']
const NUMBER  = ['fractions', 'percentages']

describe('addAll', () => {
  it('adds a whole topic to an empty selection', () => {
    expect(addAll([], ALGEBRA)).toEqual(ALGEBRA)
  })

  it('does not duplicate when select-all is pressed twice', () => {
    // The bug this exists to stop: the count reads 6 while 3 are chosen, and
    // skill_ids goes to the database with repeats in it.
    const once = addAll([], ALGEBRA)
    expect(addAll(once, ALGEBRA)).toEqual(ALGEBRA)
  })

  it('adds only what is missing, keeping what was there', () => {
    expect(addAll(['fractions', 'expanding'], ALGEBRA))
      .toEqual(['fractions', 'expanding', 'solving_linear', 'factorising'])
  })

  it('preserves order, since skill_ids is stored and compared', () => {
    expect(addAll(['z'], ['a', 'b'])).toEqual(['z', 'a', 'b'])
  })
})

describe('removeAll', () => {
  it('removes a topic without touching the others', () => {
    const both = [...NUMBER, ...ALGEBRA]
    expect(removeAll(both, ALGEBRA)).toEqual(NUMBER)
  })

  it('is a no-op for ids that were never chosen', () => {
    expect(removeAll(NUMBER, ALGEBRA)).toEqual(NUMBER)
  })

  it('does not remove a near-miss id', () => {
    expect(removeAll(['fractions_adding'], ['fractions'])).toEqual(['fractions_adding'])
  })
})

describe('toggleOne', () => {
  it('adds then removes', () => {
    const on = toggleOne([], 'fractions')
    expect(on).toEqual(['fractions'])
    expect(toggleOne(on, 'fractions')).toEqual([])
  })

  it('removing from the middle leaves the rest in order', () => {
    expect(toggleOne(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })
})

describe('allChosen', () => {
  it('is true only when every id is present', () => {
    expect(allChosen(ALGEBRA, ALGEBRA)).toBe(true)
    expect(allChosen(ALGEBRA.slice(0, 2), ALGEBRA)).toBe(false)
  })

  it('ignores extras from other topics', () => {
    expect(allChosen([...ALGEBRA, ...NUMBER], ALGEBRA)).toBe(true)
  })

  it('is FALSE for an empty topic, not vacuously true', () => {
    // every() on [] is true, which would offer "Deselect all 0".
    expect(allChosen([], [])).toBe(false)
    expect(allChosen(ALGEBRA, [])).toBe(false)
  })
})

describe('the round trip a teacher actually performs', () => {
  it('survives select all, a manual deselect, and select all again', () => {
    let v: string[] = []
    v = addAll(v, ALGEBRA)              // "Select all 3"
    v = toggleOne(v, 'expanding')       // changed their mind about one
    expect(v).toEqual(['solving_linear', 'factorising'])
    expect(allChosen(v, ALGEBRA)).toBe(false)   // so the label says Select all

    v = addAll(v, ALGEBRA)              // pressed it again
    expect(allChosen(v, ALGEBRA)).toBe(true)
    expect(v).toHaveLength(3)           // and nothing doubled up
  })

  it('keeps other topics when one is cleared', () => {
    let v = addAll(addAll([], NUMBER), ALGEBRA)
    v = removeAll(v, ALGEBRA)
    expect(v).toEqual(NUMBER)
  })
})

describe('skillSetLabel', () => {
  const nameOf = (id: string) => ({ fractions: 'Fractions', ratio: 'Ratio' })[id]

  it('names a single skill rather than counting it', () => {
    expect(skillSetLabel(['fractions'], nameOf)).toBe('Fractions')
  })

  it('counts several, because naming only the first understates the homework', () => {
    expect(skillSetLabel(['fractions', 'ratio'], nameOf)).toBe('2 skills')
  })

  it('falls back to the id when the skill is unknown', () => {
    expect(skillSetLabel(['retired_skill'], nameOf)).toBe('retired_skill')
  })

  it('has something to show for an empty set', () => {
    expect(skillSetLabel([], nameOf)).toBe('Skill')
  })
})
