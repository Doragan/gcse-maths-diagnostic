import { describe, it, expect } from 'vitest'
import { generateClassCode, isWellFormedClassCode, CLASS_CODE_LENGTH } from './classCode'

describe('generateClassCode', () => {
  it('always produces a well-formed code', () => {
    for (let i = 0; i < 500; i++) {
      expect(isWellFormedClassCode(generateClassCode())).toBe(true)
    }
  })

  it('never emits the characters that get misread aloud', () => {
    // I/1 and O/0 are the pairs that generate "the code doesn't work" when a
    // code is read across a classroom or copied off a whiteboard.
    const sample = Array.from({ length: 500 }, generateClassCode).join('')
    for (const ch of ['I', 'O', '0', '1']) {
      expect(sample.includes(ch), `alphabet leaked ${ch}`).toBe(false)
    }
  })

  it('is actually random, not a constant', () => {
    // Cheap guard against a generator that stops varying — rotation would then
    // silently hand back the same code every time.
    const seen = new Set(Array.from({ length: 200 }, generateClassCode))
    expect(seen.size).toBeGreaterThan(100)
  })
})

describe('isWellFormedClassCode', () => {
  it('accepts a code of the right shape', () => {
    expect(isWellFormedClassCode('ABCD')).toBe(true)
    expect(isWellFormedClassCode('2345')).toBe(true)
  })

  it('rejects the wrong length', () => {
    expect(isWellFormedClassCode('ABC')).toBe(false)
    expect(isWellFormedClassCode('ABCDE')).toBe(false)
    expect(isWellFormedClassCode('')).toBe(false)
  })

  it('rejects excluded and lowercase characters', () => {
    expect(isWellFormedClassCode('ABC0')).toBe(false)
    expect(isWellFormedClassCode('ABCI')).toBe(false)
    expect(isWellFormedClassCode('abcd')).toBe(false)
  })

  it('agrees with the length the join endpoint validates', () => {
    expect(CLASS_CODE_LENGTH).toBe(4)
  })
})
