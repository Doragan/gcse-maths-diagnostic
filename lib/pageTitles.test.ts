import { describe, it, expect } from 'vitest'
import { titleForPath, normalizePath, DEFAULT_TITLE } from './pageTitles'

describe('titleForPath', () => {
  it('uses the brand default for home and unmapped routes', () => {
    expect(titleForPath('/')).toBe(DEFAULT_TITLE)
    expect(titleForPath('/nope/does-not-exist')).toBe(DEFAULT_TITLE)
  })

  it('maps static routes with the — Mathsense suffix', () => {
    expect(titleForPath('/auth')).toBe('Sign in — Mathsense')
    expect(titleForPath('/dashboard')).toBe('Teacher dashboard — Mathsense')
    expect(titleForPath('/student/dashboard')).toBe('Student dashboard — Mathsense')
    expect(titleForPath('/contact')).toBe('Contact — Mathsense')
  })

  it('matches named routes before the dynamic catch-all', () => {
    expect(titleForPath('/dashboard/exam')).toBe('Mini-exam — Mathsense')
    expect(titleForPath('/dashboard/classes')).toBe('Classes — Mathsense')
    // a bare id under /dashboard is the student-overview catch-all
    expect(titleForPath('/dashboard/8f3a-uuid')).toBe('Student overview — Mathsense')
  })

  it('resolves dynamic id segments', () => {
    expect(titleForPath('/practice/question/abc-123')).toBe('Practice question — Mathsense')
    expect(titleForPath('/dashboard/assignments/create')).toBe('Create assignment — Mathsense')
    expect(titleForPath('/dashboard/assignments/xyz')).toBe('Assignment — Mathsense')
    expect(titleForPath('/student/assignments/xyz')).toBe('Assignment — Mathsense')
    expect(titleForPath('/admin/questions/new')).toBe('Admin – new question — Mathsense')
    expect(titleForPath('/admin/questions/xyz')).toBe('Admin – edit question — Mathsense')
    // the student mini-exam, and re-opening a sat paper
    expect(titleForPath('/student/exam')).toBe('Mini-exam — Mathsense')
    expect(titleForPath('/student/exam/9f3a-uuid')).toBe('Exam review — Mathsense')
  })

  it('titles the marks-entry page ahead of the class catch-all', () => {
    expect(titleForPath('/dashboard/classes/abc-123/papers')).toBe('Record a marked paper — Mathsense')
    expect(titleForPath('/dashboard/classes/abc-123')).toBe('Class — Mathsense')
    // The dynamic id must not leak into analytics.
    expect(normalizePath('/dashboard/classes/abc-123/papers')).toBe('/dashboard/classes/[id]/papers')
  })

  it('keeps the skill index distinct from an individual guide', () => {
    // /skills must not be swallowed by the /skill/[slug] pattern, or the index
    // and every guide collapse into one row in the analytics.
    expect(titleForPath('/skills')).toBe('All skills — Mathsense')
    expect(normalizePath('/skills')).toBe('/skills')
  })

  it('titles a skill guide and collapses its slug', () => {
    expect(titleForPath('/skill/proportion')).toBe('Exam briefing — Mathsense')
    expect(titleForPath('/skill/expanding-double-brackets')).toBe('Exam briefing — Mathsense')
    // Which skill was viewed rides on the event, not the path.
    expect(normalizePath('/skill/proportion')).toBe('/skill/[slug]')
  })

  it('titles the demo tour and its stops', () => {
    expect(titleForPath('/demo')).toBe('Demo – guided tour — Mathsense')
    expect(titleForPath('/demo/questions')).toBe('Demo – question showcase — Mathsense')
    // the deeper demo routes must win over the /demo hub
    expect(titleForPath('/demo/marking')).toBe('Demo – marking — Mathsense')
    expect(titleForPath('/demo/dashboard/teacher')).toBe('Demo – teacher dashboard — Mathsense')
  })

  it('ignores a trailing slash', () => {
    expect(titleForPath('/practice/')).toBe('GCSE Maths practice — Mathsense')
  })
})

describe('normalizePath', () => {
  it('collapses the sensitive parent-pay token', () => {
    expect(normalizePath('/pay/eyJhbGciOi.SECRET-TOKEN')).toBe('/pay/[token]')
  })

  it('collapses dynamic id segments', () => {
    expect(normalizePath('/practice/question/abc-123')).toBe('/practice/question/[id]')
    expect(normalizePath('/dashboard/assignments/9f3a')).toBe('/dashboard/assignments/[id]')
    expect(normalizePath('/dashboard/classes/9f3a')).toBe('/dashboard/classes/[id]')
    expect(normalizePath('/dashboard/8f3a-uuid')).toBe('/dashboard/[id]')
    expect(normalizePath('/student/assignments/xyz')).toBe('/student/assignments/[id]')
    expect(normalizePath('/student/exam/9f3a-uuid')).toBe('/student/exam/[sessionId]')
    expect(normalizePath('/student/exam')).toBe('/student/exam') // static, unchanged
    expect(normalizePath('/admin/questions/xyz')).toBe('/admin/questions/[id]')
  })

  it('leaves static routes untouched (incl. ones sharing a dynamic prefix)', () => {
    expect(normalizePath('/dashboard/exam')).toBe('/dashboard/exam')
    expect(normalizePath('/dashboard/classes')).toBe('/dashboard/classes')
    expect(normalizePath('/dashboard/assignments/create')).toBe('/dashboard/assignments/create')
    expect(normalizePath('/admin/questions/new')).toBe('/admin/questions/new')
    expect(normalizePath('/student/dashboard')).toBe('/student/dashboard')
    expect(normalizePath('/')).toBe('/')
  })

  it('ignores a trailing slash', () => {
    expect(normalizePath('/pay/token123/')).toBe('/pay/[token]')
  })
})
