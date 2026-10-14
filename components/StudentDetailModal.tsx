'use client'

import { type StudentAnalytics } from '../lib/teacherAnalytics'
import type { StudentReadiness } from '../lib/exam/classReadiness'
import StudentDetailBody from './StudentDetailBody'
import { colors, font, radius } from '../lib/styles'

/**
 * A teacher-facing version of the student dashboard, in a modal.
 *
 * The overlay and the header only — the content lives in StudentDetailBody, so
 * the same thing can be rendered as a page at /dashboard/students/[id] without
 * a second copy drifting away from this one (docs/audit/26 §4.3). Kept while
 * the route proves itself; the class roster still opens this.
 */
export default function StudentDetailModal({
  s,
  readiness = null,
  classId,
  onClose,
}: {
  s: StudentAnalytics
  /** Exam history; null before the fetch lands or before the migration is applied. */
  readiness?: StudentReadiness | null
  /** Needed to open a paper — the teacher route is scoped by class, not by session alone. */
  classId?: string
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: colors.card, borderRadius: radius.lg, maxWidth: 640, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${colors.border}`, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: font.xl, fontWeight: 700, margin: 0, color: colors.textPrimary }}>
            {s.displayName}{s.yearGroup && <span style={{ fontSize: font.sm, color: colors.textHint, fontWeight: 400 }}> · {s.yearGroup}</span>}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: font.xl, cursor: 'pointer', color: colors.textSecondary, padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        {/* body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <StudentDetailBody s={s} readiness={readiness} classId={classId} />
        </div>
      </div>
    </div>
  )
}
