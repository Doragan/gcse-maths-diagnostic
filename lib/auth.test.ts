import { describe, expect, it, vi, beforeEach } from 'vitest'

// Per-table results for the mocked query builder below, set by each test.
type Result = { data: { id: string } | null; error: { message: string } | null }
const results: Record<string, Result> = {}

// The app's Supabase client throws without env vars, and accountRoleFor only
// ever does `.from(table).select('id').eq('id', …).maybeSingle()` — so a builder
// honouring exactly that chain is enough, and keeps the test about the decision
// rather than about Supabase.
vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => results[table] ?? { data: null, error: null },
        }),
      }),
    }),
    auth: { getUser: async () => ({ data: { user: null } }) },
  },
}))

// Imported by lib/auth for unrelated paths; none of it is on the route under
// test, and loading the real modules would drag in the client just mocked.
vi.mock('./analytics', () => ({ trackEvent: () => {} }))
vi.mock('./pendingPractice', () => ({ PENDING_KEY: 'x', pendingPracticeRows: () => [] }))
vi.mock('./classGrant', () => ({ fetchMyClassGrant: async () => null }))

import { accountRoleFor } from './auth'

const row = { id: 'u1' }
const failed = { message: 'network' }

beforeEach(() => {
  delete results.teachers
  delete results.students
})

describe('accountRoleFor', () => {
  it('reports a teacher', async () => {
    results.teachers = { data: row, error: null }
    expect(await accountRoleFor('u1')).toBe('teacher')
  })

  it('reports a student', async () => {
    results.students = { data: row, error: null }
    expect(await accountRoleFor('u1')).toBe('student')
  })

  it('prefers teacher when both rows somehow exist', async () => {
    // Matches the precedence getUserRole has always had, so this refactor
    // cannot change who reaches the teacher dashboard.
    results.teachers = { data: row, error: null }
    results.students = { data: row, error: null }
    expect(await accountRoleFor('u1')).toBe('teacher')
  })

  it('reports none when neither row exists and both lookups succeeded', async () => {
    results.teachers = { data: null, error: null }
    results.students = { data: null, error: null }
    expect(await accountRoleFor('u1')).toBe('none')
  })

  // ── The bug this function exists to prevent ──────────────────────────────
  //
  // app/invite/[token] treated "no students row" as "this is a teacher", and a
  // FAILED lookup looks exactly like an absent row once the error is dropped.
  // A real student whose query hiccupped was told they were a teacher and sent
  // to the teacher dashboard. These two must never collapse into one answer.
  it('reports unknown when the teachers lookup fails', async () => {
    results.teachers = { data: null, error: failed }
    results.students = { data: null, error: null }
    expect(await accountRoleFor('u1')).toBe('unknown')
  })

  it('reports unknown when the students lookup fails', async () => {
    results.teachers = { data: null, error: null }
    results.students = { data: null, error: failed }
    expect(await accountRoleFor('u1')).toBe('unknown')
  })

  it('never reports a role off the back of a failed lookup', async () => {
    // Even with a teachers row present, an error anywhere means the picture is
    // incomplete — say so rather than act on half of it.
    results.teachers = { data: row, error: null }
    results.students = { data: null, error: failed }
    expect(await accountRoleFor('u1')).toBe('unknown')
  })

  it('keeps "nobody" and "cannot tell" distinct', async () => {
    results.teachers = { data: null, error: null }
    results.students = { data: null, error: null }
    const absent = await accountRoleFor('u1')

    results.students = { data: null, error: failed }
    const unreadable = await accountRoleFor('u1')

    expect(absent).not.toBe(unreadable)
  })
})
