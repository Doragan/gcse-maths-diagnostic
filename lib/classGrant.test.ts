import { describe, it, expect, vi } from 'vitest'

// classGrant imports ./supabase for its BROWSER path, which builds a real
// client at module scope and needs env vars CI does not have. The server path
// under test takes its client as an argument and never touches it. Same stub as
// publishedSkills.test.ts.
vi.mock('./supabase', () => ({ supabase: {} }))

import { fetchClassGrant } from './classGrant'

// ─────────────────────────────────────────────────────────────────────────────
// The server arm of the class grant, against a fake query client.
//
// WHY A FAKE RATHER THAN NO TEST. `fetchClassGrant` is I/O, and the comment on
// it is right that none of this can run against the real database from CI. But
// the thing most likely to break is not a query — it is the CONTROL FLOW
// between the two arms, and that is pure logic sitting inside an I/O function.
//
// The specific bug this guards: the previous version returned false the moment
// no class had a school_id. A self-serve tutor has never been provisioned a
// `schools` row, so EVERY one of their classes has a null school_id — the early
// return made the teacher arm unreachable for exactly the customers it exists
// for. A test that only covered "school grant works" would have passed.
// ─────────────────────────────────────────────────────────────────────────────

type Rows = Record<string, unknown[]>

/**
 * Enough of the supabase-js builder to satisfy this function: every filter is
 * a no-op recorded for assertion, and `.in`/`.gt` resolve to whatever the table
 * was seeded with. The point is the branching, not the filtering.
 */
function fakeClient(rows: Rows, calls: string[] = []) {
  const builder = (table: string) => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      not: () => chain,
      in: () => chain,
      gt: () => chain,
      then: (resolve: (v: { data: unknown[] }) => void) =>
        resolve({ data: (rows[table] ?? []) as unknown[] }),
    }
    calls.push(table)
    return chain
  }
  // No cast needed: `chain` is assignable to the `any` the real QueryClient
  // declares, so the fake satisfies it structurally.
  return { client: { from: builder }, calls }
}

const NOW = new Date('2026-10-27T12:00:00Z')

describe('fetchClassGrant', () => {
  it('returns false with no active membership, without reading anything else', async () => {
    const { client, calls } = fakeClient({ class_memberships: [] })
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(false)
    // The common case by a wide margin, so it must stay one round trip.
    expect(calls).toEqual(['class_memberships'])
  })

  it('grants on the school arm', async () => {
    const { client } = fakeClient({
      class_memberships: [{ class_id: 'c1' }],
      classes: [{ school_id: 's1', teacher_id: 't1' }],
      schools: [{ id: 's1' }],
    })
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(true)
  })

  it('short-circuits on the school arm without asking about teachers', async () => {
    const { client, calls } = fakeClient({
      class_memberships: [{ class_id: 'c1' }],
      classes: [{ school_id: 's1', teacher_id: 't1' }],
      schools: [{ id: 's1' }],
    })
    await fetchClassGrant(client, 'student-1', NOW)
    expect(calls).toEqual(['class_memberships', 'classes', 'schools'])
  })

  // ── The regression this file exists for ───────────────────────────────────
  it('grants on the teacher arm when NO class has a school attached', async () => {
    // The self-serve tutor shape: paid through Stripe, never provisioned a
    // school. The old early return made this false.
    const { client } = fakeClient({
      class_memberships: [{ class_id: 'c1' }],
      classes: [{ school_id: null, teacher_id: 't1' }],
      schools: [],
      teachers: [{ id: 't1' }],
    })
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(true)
  })

  it('falls through to the teacher arm when the school grant has lapsed', async () => {
    // A school whose grant expired, run by a teacher who pays personally. The
    // student keeps access via the teacher, which is the union working.
    const { client } = fakeClient({
      class_memberships: [{ class_id: 'c1' }],
      classes: [{ school_id: 's1', teacher_id: 't1' }],
      schools: [],            // filtered out by granted_until > now
      teachers: [{ id: 't1' }],
    })
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(true)
  })

  it('denies when neither arm holds', async () => {
    const { client } = fakeClient({
      class_memberships: [{ class_id: 'c1' }],
      classes: [{ school_id: 's1', teacher_id: 't1' }],
      schools: [],
      teachers: [],
    })
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(false)
  })

  it('denies without reading teachers when a class has no owner at all', async () => {
    // teacher_id is nullable: 20260915_class_ownership_survives_teacher sets it
    // NULL when a teacher deletes their account, deliberately keeping the class
    // and the pupils' work. Such a class grants nothing and must not produce an
    // `in ()` query with an empty list.
    const { client, calls } = fakeClient({
      class_memberships: [{ class_id: 'c1' }],
      classes: [{ school_id: null, teacher_id: null }],
    })
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(false)
    expect(calls).toEqual(['class_memberships', 'classes'])
  })

  it('returns false rather than throwing when a query blows up', async () => {
    const client = { from: () => { throw new Error('network') } }
    expect(await fetchClassGrant(client, 'student-1', NOW)).toBe(false)
  })
})
