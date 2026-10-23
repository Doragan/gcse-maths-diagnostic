'use client'

import {
  isAnsweringNow, formatLastAttempt, averageScorePct, type ProgressRow,
} from '../lib/liveProgress'
import {
  colors, font, radius, card, secondaryButton, sectionTitle,
} from '../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The live progress table — who has started, how far they are, who is working
// right now.
//
// Extracted from app/dashboard/assignments/[id]/page.tsx, where it was inline
// JSX, so the no-login class session can show the same table without a second
// copy of it (docs/audit/29 §6.4). The assignment page is now a thin caller.
//
// ⚠ THE NO-DESCRIPTORS RULE APPLIES HERE (docs/audit/12 decision 2, carried
// into docs/audit/24 Part 1 and Part 3). This reports PRESENCE and PROGRESS,
// never a verdict: no "stuck", no idle time, no per-question timing, no red
// row for someone who has not started. It matters more in a live lesson view
// than anywhere else in the product, because this is the screen most likely to
// be read in front of the class, or projected. A teacher reads the numbers and
// draws their own conclusions.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  rows: ProgressRow[]
  /** Whether the view is currently keeping itself up to date. */
  live: boolean
  /** Called when the teacher resumes a paused view. */
  onResume: () => void
  /** Advanced by the caller's poll, so "answering now" and the clock decay. */
  now: number
  loading?: boolean
  /** Heading above the table. */
  title?: string
  /**
   * What one of these people is called. An assignment has students; a class
   * session has pupils who are not students in the account sense, and calling
   * them students on screen would overstate what the product knows about them.
   */
  noun?: { one: string; many: string }
  /** First tile's label: "Assigned" for an assignment, "Joined" for a session. */
  rosterLabel?: string
  emptyMessage?: string
}

export default function LiveProgressTable({
  rows, live, onResume, now,
  loading = false,
  title = 'Results',
  noun = { one: 'student', many: 'students' },
  rosterLabel = 'Assigned',
  emptyMessage = 'No students have been targeted or none have started yet.',
}: Props) {
  // Shown only when somebody has answered a multi-part question. On a task
  // made entirely of single-part ones this would be a column of dashes.
  const anyParts = rows.some(r => r.parts !== null)

  const completedCount = rows.filter(r => r.is_complete).length
  const startedCount   = rows.filter(r => r.total_attempts > 0).length
  const avgScorePct    = averageScorePct(rows)

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, margin: '0 0 12px' }}>
        <h2 style={{ ...sectionTitle, margin: 0 }}>
          {title}{' '}
          {rows.length > 0 && (
            <span style={{ color: colors.textHint, fontWeight: '400' }}>
              ({rows.length} {rows.length !== 1 ? noun.many : noun.one})
            </span>
          )}
        </h2>
        {/* Say plainly whether what's on screen is keeping itself up to date.
            A stale table that looks live is worse than no live view at all. */}
        {live ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', color: colors.textHint, whiteSpace: 'nowrap' as const }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.success, flexShrink: 0 }} />
            Updating live
          </span>
        ) : (
          <button
            onClick={onResume}
            style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: '11px' }}
          >
            Paused · Resume
          </button>
        )}
      </div>

      {/* Summary stats row */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: '0', borderRadius: radius.md, overflow: 'hidden', border: `1px solid ${colors.border}`, marginBottom: '16px' }}>
          {[
            { label: rosterLabel, value: String(rows.length) },
            { label: 'Started',   value: String(startedCount) },
            { label: 'Complete',  value: String(completedCount), highlight: completedCount === rows.length },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ flex: 1, padding: '10px 12px', borderRight: `1px solid ${colors.border}`, background: highlight ? colors.successLight : colors.cardAlt, textAlign: 'center' as const }}>
              <p style={styles.tileLabel}>{label}</p>
              <p style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: highlight ? colors.successText : colors.textPrimary }}>{value}</p>
            </div>
          ))}
          <div style={{ flex: 1, padding: '10px 12px', background: colors.cardAlt, textAlign: 'center' as const }}>
            <p style={styles.tileLabel}>Avg score</p>
            <p style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
              {avgScorePct === null ? '—' : `${avgScorePct}%`}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: font.base, color: colors.textHint, margin: '12px 0 0' }}>Loading results…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: font.base, color: colors.textHint, margin: '12px 0 0', lineHeight: '1.6' }}>
          {emptyMessage}
        </p>
      ) : (
        <div style={{ marginTop: '12px', overflowX: 'auto' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: font.sm }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={styles.th}>{noun.one.charAt(0).toUpperCase() + noun.one.slice(1)}</th>
                {/* Progress and Score are different questions and the table used
                    to answer only the second. "1/10" could mean one question
                    answered and right, or ten answered and nine wrong — the same
                    cell for two situations a teacher would act on differently.
                    Both now share a denominator so they compare at a glance. */}
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Score</th>
                {/* Parts right across the multi-part questions THIS person
                    answered. Deliberately not comparable between rows — they
                    may have had different questions — so it sits after Score,
                    which is. It answers the question Score cannot: did they
                    half-get it, or miss it entirely. */}
                {anyParts && <th style={styles.th}>Parts</th>}
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Last attempt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                // Presence, not a verdict: who is working right now and when
                // everyone else last did.
                const here = isAnsweringNow(r.last_attempt_at, now)
                return (
                  <tr key={r.subject_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '500', color: colors.textPrimary }}>{r.display_name}</span>
                      {r.year_group && <span style={{ color: colors.textHint }}> · {r.year_group}</span>}
                    </td>
                    {/* `progress` is whatever the completion rule counts, so
                        this number and the Status cell can never disagree. Null
                        on an open-ended task, which has nothing to be short of. */}
                    <td style={{ ...styles.td, whiteSpace: 'nowrap' as const }}>
                      {r.progress ? `${r.progress.done}/${r.progress.target}` : '—'}
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600', color: colors.textPrimary }}>
                      {r.score ?? '—'}
                    </td>
                    {anyParts && (
                      <td style={{ ...styles.td, color: colors.textSecondary, whiteSpace: 'nowrap' as const }}>
                        {r.parts ? `${r.parts.done}/${r.parts.target}` : '—'}
                      </td>
                    )}
                    <td style={styles.td}>
                      {r.total_attempts === 0 ? (
                        <span style={{ color: colors.textHint }}>Not started</span>
                      ) : r.is_complete ? (
                        <span style={{ color: colors.successText, fontWeight: '600' }}>✓ Complete</span>
                      ) : (
                        <span style={{ color: colors.warning, fontWeight: '500' }}>In progress</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, color: here ? colors.successText : colors.textHint, whiteSpace: 'nowrap' as const }}>
                      {here && (
                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: colors.success, marginRight: 6 }} />
                      )}
                      {formatLastAttempt(r.last_attempt_at, now)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tileLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textSecondary,
    margin: '0 0 2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 10px',
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '10px 10px',
    fontSize: font.sm,
    verticalAlign: 'middle' as const,
  },
}
