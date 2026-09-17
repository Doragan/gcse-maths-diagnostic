import { describe, it, expect } from 'vitest'
import { summariseSchools } from './adminSchools'

const NOW = Date.UTC(2026, 8, 18, 12, 0, 0)
const DAY = 86400000
const iso = (ms: number) => new Date(ms).toISOString()

const school = (id: string, seats = 30, grantedUntil: string | null = iso(NOW + 30 * DAY)) =>
  ({ id, name: `School ${id}`, seats, granted_until: grantedUntil })

const cls = (id: string, school_id: string | null, teacher_id: string | null = 't1') =>
  ({ id, school_id, teacher_id })

const member = (class_id: string, student_id: string, status = 'active') =>
  ({ class_id, student_id, status })

describe('summariseSchools — the seat rule', () => {
  it('counts a student in two of the school\'s classes ONCE', () => {
    // The rule the design settled first. Counting membership rows would
    // overcharge exactly the schools that teach in sets.
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1'), cls('c2', 's1')],
      memberships: [member('c1', 'stu1'), member('c2', 'stu1')],
      now: NOW,
    })
    expect(r.schools[0].seatsUsed).toBe(1)
  })

  it('counts distinct students across classes', () => {
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1'), cls('c2', 's1')],
      memberships: [member('c1', 'stu1'), member('c2', 'stu2'), member('c2', 'stu1')],
      now: NOW,
    })
    expect(r.schools[0].seatsUsed).toBe(2)
  })

  it('ignores a student who has left', () => {
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1')],
      memberships: [member('c1', 'stu1', 'left'), member('c1', 'stu2')],
      now: NOW,
    })
    expect(r.schools[0].seatsUsed).toBe(1)
  })

  it('does not count a student in another school\'s class', () => {
    const r = summariseSchools({
      schools: [school('s1'), school('s2')],
      classes: [cls('c1', 's1'), cls('c2', 's2')],
      memberships: [member('c1', 'stu1'), member('c2', 'stu2')],
      now: NOW,
    })
    expect(r.schools.find(s => s.id === 's1')!.seatsUsed).toBe(1)
    expect(r.schools.find(s => s.id === 's2')!.seatsUsed).toBe(1)
  })

  it('does not count a student in an unattached class', () => {
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1'), cls('c2', null)],
      memberships: [member('c1', 'stu1'), member('c2', 'stu2')],
      now: NOW,
    })
    expect(r.schools[0].seatsUsed).toBe(1)
  })
})

describe('summariseSchools — over the cap', () => {
  it('reports how far over, and does not block', () => {
    // Seats are recorded, not enforced: going over is allowed and settled at
    // renewal, so this reports rather than refuses.
    const r = summariseSchools({
      schools: [school('s1', 2)],
      classes: [cls('c1', 's1')],
      memberships: [member('c1', 'a'), member('c1', 'b'), member('c1', 'c')],
      now: NOW,
    })
    expect(r.schools[0].overBy).toBe(1)
    expect(r.totals.overCap).toBe(1)
  })

  it('is zero, never negative, when under', () => {
    const r = summariseSchools({
      schools: [school('s1', 30)],
      classes: [cls('c1', 's1')],
      memberships: [member('c1', 'a')],
      now: NOW,
    })
    expect(r.schools[0].overBy).toBe(0)
    expect(r.totals.overCap).toBe(0)
  })
})

describe('summariseSchools — whether the grant is live', () => {
  it('an expired grant is not in date', () => {
    const r = summariseSchools({
      schools: [school('s1', 30, iso(NOW - DAY))],
      classes: [], memberships: [], now: NOW,
    })
    expect(r.schools[0].inDate).toBe(false)
  })

  it('a NULL grant date is never in date', () => {
    const r = summariseSchools({
      schools: [school('s1', 30, null)],
      classes: [], memberships: [], now: NOW,
    })
    expect(r.schools[0].inDate).toBe(false)
  })

  it('an unreadable grant date is not in date', () => {
    const r = summariseSchools({
      schools: [school('s1', 30, 'not a date')],
      classes: [], memberships: [], now: NOW,
    })
    expect(r.schools[0].inDate).toBe(false)
  })

  it('counts in-date schools in the totals', () => {
    const r = summariseSchools({
      schools: [school('s1'), school('s2', 30, iso(NOW - DAY))],
      classes: [], memberships: [], now: NOW,
    })
    expect(r.totals.schools).toBe(2)
    expect(r.totals.inDate).toBe(1)
  })

  it('puts in-date schools first, then the fullest', () => {
    const r = summariseSchools({
      schools: [
        school('expired', 30, iso(NOW - DAY)),
        school('quiet'),
        school('busy'),
      ],
      classes: [cls('c1', 'busy'), cls('c2', 'quiet')],
      memberships: [member('c1', 'a'), member('c1', 'b'), member('c2', 'c')],
      now: NOW,
    })
    expect(r.schools.map(s => s.id)).toEqual(['busy', 'quiet', 'expired'])
  })
})

describe('summariseSchools — classes and teachers', () => {
  it('counts distinct teachers across a school\'s classes', () => {
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1', 't1'), cls('c2', 's1', 't1'), cls('c3', 's1', 't2')],
      memberships: [], now: NOW,
    })
    expect(r.schools[0].classes).toBe(3)
    expect(r.schools[0].teachers).toBe(2)
  })

  it('does not count a null teacher as a teacher', () => {
    // A class whose teacher account was deleted keeps the class but loses the
    // owner — see 20260915_class_ownership_survives_teacher.sql.
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1', null)],
      memberships: [], now: NOW,
    })
    expect(r.schools[0].classes).toBe(1)
    expect(r.schools[0].teachers).toBe(0)
  })

  it('reports unattached and orphaned classes separately', () => {
    // Unattached is normal: an individual teacher's class. An orphan has neither
    // a teacher nor a school and is waiting for nothing.
    const r = summariseSchools({
      schools: [school('s1')],
      classes: [cls('c1', 's1'), cls('c2', null, 't9'), cls('c3', null, null)],
      memberships: [], now: NOW,
    })
    expect(r.unattachedClasses).toBe(2)
    expect(r.orphanClasses).toBe(1)
  })
})

describe('summariseSchools — nothing to report', () => {
  it('survives an empty database', () => {
    const r = summariseSchools({ schools: [], classes: [], memberships: [], now: NOW })
    expect(r.schools).toEqual([])
    expect(r.totals).toMatchObject({ schools: 0, inDate: 0, seats: 0, seatsUsed: 0, overCap: 0 })
    expect(r.unattachedClasses).toBe(0)
  })

  it('reports a school with no classes at all as granted but unused', () => {
    // The state immediately after provisioning, before any class is attached.
    const r = summariseSchools({
      schools: [school('s1', 32)], classes: [], memberships: [], now: NOW,
    })
    expect(r.schools[0]).toMatchObject({ seatsUsed: 0, classes: 0, teachers: 0, inDate: true })
  })
})
