import { describe, it, expect } from 'vitest'
import { titleForPath, DEFAULT_TITLE } from './pageTitles'

describe('titleForPath', () => {
  it('uses the brand default for home and unmapped routes', () => {
    expect(titleForPath('/')).toBe(DEFAULT_TITLE)
    expect(titleForPath('/nope/does-not-exist')).toBe(DEFAULT_TITLE)
  })

  it('maps static routes with the — Mathsense suffix', () => {
    expect(titleForPath('/auth')).toBe('Sign in — Mathsense')
    expect(titleForPath('/dashboard')).toBe('Teacher dashboard — Mathsense')
    expect(titleForPath('/student/dashboard')).toBe('Student dashboard — Mathsense')
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
  })

  it('ignores a trailing slash', () => {
    expect(titleForPath('/practice/')).toBe('Practise GCSE Maths — Mathsense')
  })
})
