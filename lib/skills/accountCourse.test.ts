import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { applyAccountCourse, courseIdFor, courseParts } from './accountCourse'
import { getQualification, DEFAULT_QUALIFICATION } from './qualificationPreference'
import { getTier } from './tierPreference'
import { courses, COURSE_IDS_ALL } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// The account course is the widest preference there is: it decides the skill
// pool, the boards and the tier for a signed-in student, on every device. It
// reaches the app by WRITING THROUGH to the per-browser stores when a profile
// is fetched, so these tests are about that handoff rather than about the UI.
// ─────────────────────────────────────────────────────────────────────────────

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
  })
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get('s:' + k) ?? null,
    setItem: (k: string, v: string) => { store.set('s:' + k, v) },
  })
})

afterEach(() => { vi.unstubAllGlobals() })

describe('course id round trip', () => {
  it('decomposes every course id back into the pair that built it', () => {
    for (const c of courses) {
      const parts = courseParts(c.id)
      expect(parts, c.id).not.toBeNull()
      expect(parts!.qualification, c.id).toBe(c.qualification)
      expect(courseIdFor(parts!.qualification, parts!.tier), c.id).toBe(c.id)
    }
  })

  it('refuses an id it does not know, rather than guessing', () => {
    // The id comes off a database row that another deploy may have written.
    expect(courseParts('a_level_further')).toBeNull()
    expect(courseParts('')).toBeNull()
    expect(courseParts(null)).toBeNull()
    expect(courseParts(undefined)).toBeNull()
  })

  it('lists exactly the courses that exist', () => {
    expect([...COURSE_IDS_ALL].sort()).toEqual(courses.map(c => c.id).sort())
  })
})

describe('applying an account course', () => {
  it('puts both the qualification and the tier into this browser', () => {
    const applied = applyAccountCourse({ course_id: 'igcse_higher' })
    expect(applied).toEqual({ qualification: 'igcse', tier: 'higher' })
    expect(getQualification()).toBe('igcse')
    expect(getTier()).toBe('higher')
  })

  it('overrides a different choice already made in this browser', () => {
    // The point of the feature: the account wins over the device.
    applyAccountCourse({ course_id: 'igcse_higher' })
    expect(getQualification()).toBe('igcse')

    applyAccountCourse({ course_id: 'gcse_foundation' })
    expect(getQualification()).toBe('gcse')
    expect(getTier()).toBe('foundation')
  })

  it('leaves the browser alone when the account has not been asked', () => {
    // NULL means not stated. An account that has never chosen must not stamp a
    // default over a preference the student already set on this device.
    applyAccountCourse({ course_id: 'igcse_higher' })
    expect(applyAccountCourse({ course_id: null })).toBeNull()
    expect(applyAccountCourse({})).toBeNull()
    expect(applyAccountCourse(null)).toBeNull()
    expect(getQualification()).toBe('igcse')
  })

  it('falls back rather than throwing on a course it does not know', () => {
    expect(applyAccountCourse({ course_id: 'btec_maths' })).toBeNull()
    expect(getQualification()).toBe(DEFAULT_QUALIFICATION)
  })
})

describe('the migration guard', () => {
  it('allows exactly the course ids this build defines', () => {
    // The client can write students.course_id (a column-level grant), and
    // courses live in code rather than in a table, so this CHECK is the only
    // server-side guard. If the two drift, the database starts rejecting a
    // course the app offers — or accepting one it cannot read back.
    const sql = readFileSync(
      join(process.cwd(), 'supabase', 'migrations', '20261016_student_course.sql'),
      'utf8',
    )
    // ...pop(), not [1]: the constraint name appears twice (the idempotent drop
    // and the add), so [1] is the empty gap between them.
    const block = sql.split('students_course_id_known').pop() ?? ''
    const allowed = [...block.matchAll(/'([a-z_]+)'/g)].map(m => m[1])
    expect(allowed.sort(), 'CHECK list vs data/courses.ts').toEqual([...COURSE_IDS_ALL].sort())
  })

  it('keeps the table-level UPDATE revoke in force', () => {
    // The whole safety argument is that ONLY course_id was re-opened. A bare
    // 'grant update on students' here would hand back is_admin and
    // subscription_tier with it.
    const sql = readFileSync(
      join(process.cwd(), 'supabase', 'migrations', '20261016_student_course.sql'),
      'utf8',
    )
    const grants = [...sql.matchAll(/^grant\s+update[^;]*;/gim)].map(m => m[0])
    expect(grants, 'grant statements').toHaveLength(1)
    expect(grants[0]).toContain('(course_id)')
  })
})
