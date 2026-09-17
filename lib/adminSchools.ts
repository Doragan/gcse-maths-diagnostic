/**
 * The numbers behind /admin/schools — what each school was granted, and what it
 * is actually using.
 *
 * Step 5 of docs/audit/20-school-accounts-design.md. Pure, with `now` injected,
 * so the seat rule is testable without a database and the route is left doing
 * nothing but fetching rows.
 *
 * ── Why this exists at all ──────────────────────────────────────────────────
 * Access is invoice-paced: a school is provisioned by hand, in SQL. The seat
 * count and the grant date are therefore only ever as reliable as whatever query
 * was last pasted into the SQL editor, and two provisioning attempts have already
 * failed there — one on a placeholder sent to the database verbatim, one on a
 * lookup keyed by a name containing an em dash. A read-only page removes the
 * step where that goes wrong.
 *
 * ── No personal data ────────────────────────────────────────────────────────
 * Counts and school names only. No student id, no display name, no email address
 * enters this module, so none can reach the page.
 */

export type SchoolRow = {
  id: string
  name: string
  seats: number
  granted_until: string | null
}

export type ClassRow = {
  id: string
  school_id: string | null
  teacher_id: string | null
}

export type MembershipRow = {
  class_id: string
  student_id: string
  status: string
}

export type SchoolSummary = {
  id: string
  name: string
  seats: number
  granted_until: string | null
  /** Whether the grant is live right now. A null date is never in date. */
  inDate: boolean
  /**
   * DISTINCT students with an active membership in any of this school's classes.
   *
   * Distinct is the whole point, and it is the rule the design settled first: a
   * student in two of a school's classes must not cost two seats. Counting
   * membership rows would be the obvious implementation and would overcharge
   * exactly the schools that organise teaching in sets.
   */
  seatsUsed: number
  /** How far over the cap, or 0. Seats are recorded, not enforced. */
  overBy: number
  classes: number
  /** Distinct teachers owning this school's classes. */
  teachers: number
}

export type SchoolsReport = {
  generatedAt: string
  schools: SchoolSummary[]
  totals: {
    schools: number
    inDate: number
    seats: number
    seatsUsed: number
    /** Schools currently over their seat count. */
    overCap: number
  }
  /** Classes belonging to no school — the normal case for an individual teacher. */
  unattachedClasses: number
  /**
   * Classes with NEITHER a teacher nor a school.
   *
   * These are orphans: a teacher's account was deleted, which now sets the class
   * teacher to null rather than destroying the class and everyone's work in it
   * (20260915_class_ownership_survives_teacher.sql). A class with a school is
   * waiting to be reassigned; one with neither is waiting for nothing, and the
   * design says to sweep them rather than let them accumulate. Surfaced here so
   * that sweeping is a decision rather than a discovery.
   */
  orphanClasses: number
}

export function summariseSchools(input: {
  schools: SchoolRow[]
  classes: ClassRow[]
  memberships: MembershipRow[]
  now?: number
}): SchoolsReport {
  const now = input.now ?? Date.now()

  // class_id -> the active students in it. Built once; every school reads from it.
  const activeByClass = new Map<string, Set<string>>()
  for (const m of input.memberships) {
    if (m.status !== 'active') continue
    let set = activeByClass.get(m.class_id)
    if (!set) { set = new Set(); activeByClass.set(m.class_id, set) }
    set.add(m.student_id)
  }

  const schools: SchoolSummary[] = input.schools.map(s => {
    const own = input.classes.filter(c => c.school_id === s.id)

    // One set across ALL the school's classes, so a student in two of them is
    // counted once. See the note on seatsUsed.
    const students = new Set<string>()
    for (const c of own) {
      for (const id of activeByClass.get(c.id) ?? []) students.add(id)
    }

    const teachers = new Set(
      own.map(c => c.teacher_id).filter((t): t is string => t !== null),
    )

    const granted = s.granted_until ? Date.parse(s.granted_until) : NaN
    const inDate = Number.isFinite(granted) && granted > now
    const seatsUsed = students.size

    return {
      id: s.id,
      name: s.name,
      seats: s.seats,
      granted_until: s.granted_until,
      inDate,
      seatsUsed,
      overBy: Math.max(0, seatsUsed - s.seats),
      classes: own.length,
      teachers: teachers.size,
    }
  })

  // In-date first, then the fullest, so the row needing attention is at the top.
  schools.sort((a, b) =>
    (Number(b.inDate) - Number(a.inDate)) || (b.seatsUsed - a.seatsUsed),
  )

  return {
    generatedAt: new Date(now).toISOString(),
    schools,
    totals: {
      schools: schools.length,
      inDate: schools.filter(s => s.inDate).length,
      seats: schools.reduce((n, s) => n + s.seats, 0),
      seatsUsed: schools.reduce((n, s) => n + s.seatsUsed, 0),
      overCap: schools.filter(s => s.overBy > 0).length,
    },
    unattachedClasses: input.classes.filter(c => c.school_id === null).length,
    orphanClasses: input.classes.filter(c => c.school_id === null && c.teacher_id === null).length,
  }
}
