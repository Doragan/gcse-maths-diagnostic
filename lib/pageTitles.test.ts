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

  it('keeps the tutor student view out of the /dashboard/[id] catch-all', () => {
    // /dashboard/students matches /^\/dashboard\/[^/]+$/ perfectly well, so
    // without a rule above it this page would be titled "Student overview" and
    // reported as /dashboard/[id] — a wrong tab title and two different routes
    // silently merged into one row in GA4.
    expect(titleForPath('/dashboard/students')).toBe('My students — Mathsense')
    expect(normalizePath('/dashboard/students')).toBe('/dashboard/students')

    expect(titleForPath('/dashboard/students/abc-123')).toBe('Student — Mathsense')
    expect(normalizePath('/dashboard/students/abc-123')).toBe('/dashboard/students/[id]')

    // And the catch-all it sits above still works for what it was meant for.
    expect(titleForPath('/dashboard/abc-123')).toBe('Student overview — Mathsense')
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
    expect(titleForPath('/practice/')).toBe('Maths practice — Mathsense')
  })
})

describe('qualification neutrality', () => {
  // A student who switches to International GCSE keeps using these pages, so a
  // title that names a qualification is wrong for them. The fix is neutral
  // wording rather than a per-student title: titleForPath is a pure function of
  // the path and shares RULES with normalizePath, which feeds GA4's page_title,
  // so branching on a preference would split one surface into two rows.
  //
  // DEFAULT_TITLE is deliberately NOT in this list. It is the landing page and
  // the unmapped-route fallback — marketing copy that has to match the default
  // in app/layout.tsx, read before anyone has chosen anything.
  const studentJourney = [
    '/practice',
    '/practice/question/abc-123',
    '/skills',
    '/skill/percentage-change',
    '/student/dashboard',
    '/student/exam',
    '/account',
  ]

  it('never names a qualification in a page the student studies in', () => {
    const naming = studentJourney
      .map(path => [path, titleForPath(path)] as const)
      .filter(([, title]) => /GCSE|International|4MA1|iGCSE/i.test(title))
    expect(naming, 'titles claiming a qualification').toEqual([])
  })

  it('still titles the practice page something useful', () => {
    // Neutral must not mean empty — the tab still has to say what the page is.
    expect(titleForPath('/practice')).toBe('Maths practice — Mathsense')
  })
})

describe('normalizePath', () => {
  it('collapses the sensitive parent-pay token', () => {
    expect(normalizePath('/pay/eyJhbGciOi.SECRET-TOKEN')).toBe('/pay/[token]')
  })

  it('maps the class people sub-page without disturbing the bare class route', () => {
    expect(titleForPath('/dashboard/classes/abc-123/people')).toBe('Class people — Mathsense')
    expect(normalizePath('/dashboard/classes/abc-123/people')).toBe('/dashboard/classes/[id]/people')
    // The sibling routes must be unaffected by the new rule sitting above them.
    expect(titleForPath('/dashboard/classes/abc-123')).toBe('Class — Mathsense')
    expect(normalizePath('/dashboard/classes/abc-123')).toBe('/dashboard/classes/[id]')
    expect(normalizePath('/dashboard/classes/abc-123/papers')).toBe('/dashboard/classes/[id]/papers')
  })

  it('collapses the class-invitation token', () => {
    // The invitation token is a bearer credential emailed to one address: it
    // claims a place in a named class. Letting it reach GA4 as a page path
    // would both leak it to a third country and store it next to a child's
    // session. Same reasoning as /pay/[token] above.
    expect(normalizePath('/invite/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe('/invite/[token]')
    expect(titleForPath('/invite/a1b2c3d4e5f6')).toBe('Class invitation — Mathsense')
    // And the title must not carry the class name either — it is read before
    // anyone is signed in, and it lands in browser history.
    expect(titleForPath('/invite/anything')).not.toMatch(/class [0-9]/i)
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
