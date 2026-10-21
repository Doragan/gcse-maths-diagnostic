'use client'

import { readJoinedSession, readSessionAnswered } from '../../lib/classSessions'
import { colors, font, radius } from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Which lesson a pupil is in, and how far through (docs/audit/29).
//
// A component rather than inline JSX because there are TWO question surfaces —
// the single-part page and MultiPartQuestion, which renders its own layout and
// returns before the page's own markup. The first version of this lived in the
// page only, so a pupil who happened to be served a multi-part question lost
// every trace of being in a lesson. Found by walking the flow in a browser.
//
// ⚠ NO SCORE AND NO VERDICT, matching the teacher's view (docs/audit/12
// decision 2): how many answered, never how many right. The pupil already gets
// per-question feedback; a running score on a screen in a classroom is a
// different thing, and not one this feature is for.
//
// The pupil is NOT stopped at the target. Reaching it marks them complete on
// the teacher's screen, and anything after that is simply more practice.
// ─────────────────────────────────────────────────────────────────────────────

export default function ClassSessionBanner() {
  const joined = readJoinedSession()
  if (!joined) return null

  // Read here rather than taken as a prop, so both surfaces show the same
  // number without each having to track it. Re-read on every render, which
  // happens whenever an answer is submitted.
  const answered = readSessionAnswered()

  return (
    <div style={styles.banner}>
      <span style={{ fontWeight: '500', color: colors.textPrimary }}>
        {joined.title || 'Class session'}
      </span>
      <span style={{ color: colors.textHint, flexShrink: 0 }}>
        {joined.target
          ? `${answered} of ${joined.target} answered`
          : `${answered} answered`}
      </span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
    fontSize: font.sm,
    marginBottom: '16px',
  },
}
