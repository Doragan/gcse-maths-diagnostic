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

describe('agreement with the class_sessions CHECK constraint', () => {
  // class_sessions.code carries a CHECK that spells this alphabet out
  // (supabase/migrations/20261020_class_sessions.sql). Two copies of one
  // alphabet is a silent-failure shape: widen ALPHABET and every session
  // created with a new character is rejected by the database at the moment a
  // teacher is standing in front of a class. This pins them together — if it
  // fails, update the CHECK in that migration.
  const DB_CHECK = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/

  it('accepts every code the generator can mint', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateClassCode()
      expect(DB_CHECK.test(code), `the DB would reject ${code}`).toBe(true)
    }
  })

  it('rejects what the TS guard rejects, so the two agree on bad input', () => {
    for (const bad of ['abcd', 'ABC0', 'ABCI', 'ABC', 'ABCDE', 'AB-D', '']) {
      expect(DB_CHECK.test(bad), `${bad} passed the DB check`).toBe(false)
      expect(isWellFormedClassCode(bad), `${bad} passed the TS guard`).toBe(false)
    }
  })
})
