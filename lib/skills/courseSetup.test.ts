import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  tierForTargetGrade, shouldAskForCourse,
  isCoursePromptDismissed, dismissCoursePrompt,
  TARGET_GRADES, LOWEST_HIGHER_ONLY_GRADE,
} from './courseSetup'
import { courseIdFor, courseParts } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// The target grade is asked INSTEAD of the tier, so the inference is the whole
// feature: get it wrong and a student is placed on a paper they are not sitting
// by a question they answered honestly.
// ─────────────────────────────────────────────────────────────────────────────

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
  })
})

afterEach(() => { vi.unstubAllGlobals() })

describe('tier from target grade', () => {
  it('puts every grade Foundation cannot award onto Higher', () => {
    // Foundation tops out at 5 on both GCSE and 4MA1. A student aiming above
    // that is sitting Higher whether or not they know the word.
    for (const g of [6, 7, 8, 9]) {
      expect(tierForTargetGrade(g), 'grade ' + g).toBe('higher')
    }
  })

  it('keeps the overlap grades on Foundation', () => {
    // Higher also awards 4 and 5, so these could go either way. Foundation is
    // chosen for the reason tierPreference already defaults there: content not
    // on your paper is worse than content you have already met.
    for (const g of [1, 2, 3, 4, 5]) {
      expect(tierForTargetGrade(g), 'grade ' + g).toBe('foundation')
    }
  })

  it('offers every GCSE grade, highest first', () => {
    expect([...TARGET_GRADES]).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1])
    expect(LOWEST_HIGHER_ONLY_GRADE).toBe(6)
  })

  it('composes with the course id the account stores', () => {
    // End to end: the answer a student gives becomes a real course.
    const id = courseIdFor('igcse', tierForTargetGrade(7))
    expect(id).toBe('igcse_higher')
    expect(courseParts(id)).toEqual({ qualification: 'igcse', tier: 'higher' })

    expect(courseIdFor('gcse', tierForTargetGrade(4))).toBe('gcse_foundation')
  })
})

describe('who gets asked', () => {
  it('asks a student whose account has no course', () => {
    expect(shouldAskForCourse(null)).toBe(true)
    expect(shouldAskForCourse(undefined)).toBe(true)
    expect(shouldAskForCourse('')).toBe(true)
  })

  it('never asks a student who already has one', () => {
    // The answer is on the ACCOUNT, so this holds on every device without the
    // dismissal flag having to travel.
    expect(shouldAskForCourse('gcse_higher')).toBe(false)
    dismissCoursePrompt()
    expect(shouldAskForCourse('gcse_higher')).toBe(false)
  })

  it('stops asking once declined', () => {
    expect(shouldAskForCourse(null)).toBe(true)
    dismissCoursePrompt()
    expect(isCoursePromptDismissed()).toBe(true)
    expect(shouldAskForCourse(null)).toBe(false)
  })

  it('shows the card rather than hiding it when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    })
    // Private browsing. Failing towards asking is safe because the card is
    // dismissible; failing towards silence would hide the feature entirely.
    expect(() => dismissCoursePrompt()).not.toThrow()
    expect(isCoursePromptDismissed()).toBe(false)
    expect(shouldAskForCourse(null)).toBe(true)
  })

  it('does not ask during server rendering', () => {
    vi.unstubAllGlobals()
    expect(isCoursePromptDismissed()).toBe(false)
    expect(() => dismissCoursePrompt()).not.toThrow()
  })
})
