'use client'

import { skillsById } from '../lib/skills/skillGraph'
import type { SessionInsights } from '../lib/sessionInsights'
import { colors, font, radius, card, sectionTitle } from '../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// What the class is finding hard — the teacher's half of a running session.
//
// ── Why this is a disclosure, and why it is closed ─────────────────────────
//
// A teacher with one screen mirrors their laptop to the projector, so whatever
// is on this page is on the wall. Pupil names are already below the code card
// for that reason, and this panel sits below them and starts CLOSED. Opening
// it is a deliberate act, which is the right shape for "six of them got this
// wrong" in front of the six.
//
// ── Why counts, not just percentages ───────────────────────────────────────
//
// "100% wrong" is one pupil as often as it is the class. Every line leads with
// how many people, because that is the number a teacher acts on — see the
// ranking rule in lib/sessionInsights.ts.
//
// ── Why nothing here names a pupil ─────────────────────────────────────────
//
// Not for privacy — the table above this one is full of names. It is that
// "who got it wrong" is a different question from "what do I reteach", and
// mixing them produces a screen that answers neither. The names are one
// section up if the teacher wants them.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  insights: SessionInsights
  /** How many questions to list before it stops being a lesson decision. */
  topN?: number
}

const DEFAULT_TOP_N = 5

export default function SessionInsightsPanel({ insights, topN = DEFAULT_TOP_N }: Props) {
  const { questions, skills } = insights
  const nothingYet = questions.length === 0 && skills.length === 0

  return (
    <details style={{ ...card, padding: 0 }}>
      <summary style={styles.summary}>
        <span style={{ ...sectionTitle, margin: 0 }}>Where the class is struggling</span>
        <span style={styles.hint}>
          {nothingYet
            ? 'nothing yet'
            : questions.length > 0
              ? `${questions.length} question${questions.length === 1 ? '' : 's'} to look at`
              : 'by skill'}
        </span>
      </summary>

      <div style={styles.body}>
        {nothingYet ? (
          <p style={styles.empty}>
            Once a few answers are in, the questions most pupils are getting wrong will appear
            here, with a breakdown by skill.
          </p>
        ) : (
          <>
            {questions.length > 0 && (
              <section>
                <h3 style={styles.subhead}>Hardest questions so far</h3>
                <ol style={styles.list}>
                  {questions.slice(0, topN).map(q => (
                    <li key={q.questionId} style={styles.questionRow}>
                      <span style={styles.count}>
                        {q.wrong} of {q.attempted}
                      </span>
                      <span style={styles.prompt}>{q.prompt}</span>
                    </li>
                  ))}
                </ol>
                {questions.length > topN && (
                  <p style={styles.note}>
                    …and {questions.length - topN} more with at least one wrong answer.
                  </p>
                )}
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <h3 style={styles.subhead}>By skill</h3>
                <div style={styles.skillList}>
                  {skills.map(s => (
                    <div key={s.skillId} style={styles.skillRow}>
                      <span style={styles.skillName}>
                        {skillsById[s.skillId]?.name ?? s.skillId}
                      </span>
                      {/* A bar as well as a number: five skills in a column are
                          compared by eye long before they are read. */}
                      <span style={styles.barTrack}>
                        <span style={{ ...styles.barFill, width: `${s.pctCorrect}%`, background: barColour(s.pctCorrect) }} />
                      </span>
                      <span style={{ ...styles.skillPct, color: barColour(s.pctCorrect) }}>
                        {s.pctCorrect}%
                      </span>
                      <span style={styles.skillCount}>
                        {s.correct}/{s.attempted}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={styles.note}>
                  A question covering two of the chosen skills counts under both, so these do not
                  add up to the number of answers given.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </details>
  )
}

/**
 * Three bands, not a gradient. A teacher scanning five bars needs "fine /
 * watch / reteach", and a continuous scale makes 61% and 59% look like a
 * distinction worth drawing.
 */
function barColour(pct: number): string {
  if (pct >= 70) return colors.successText
  if (pct >= 40) return colors.warningText
  return colors.dangerText
}

const styles: Record<string, React.CSSProperties> = {
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    listStyle: 'none',
  },
  hint: {
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  body: {
    padding: '0 20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '16px',
  },
  empty: {
    fontSize: font.base,
    color: colors.textSecondary,
    margin: 0,
    lineHeight: '1.6',
  },
  subhead: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    margin: '0 0 10px',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  questionRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'baseline',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  },
  count: {
    flexShrink: 0,
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.dangerText,
    minWidth: '62px',
  },
  prompt: {
    fontSize: font.sm,
    color: colors.textPrimary,
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  note: {
    fontSize: font.sm,
    color: colors.textHint,
    margin: '10px 0 0',
    lineHeight: '1.5',
  },
  skillList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  skillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  skillName: {
    fontSize: font.sm,
    color: colors.textPrimary,
    flex: '1 1 40%',
    minWidth: 0,
  },
  barTrack: {
    flex: '1 1 30%',
    height: '8px',
    borderRadius: radius.full,
    background: colors.border,
    overflow: 'hidden',
    minWidth: '48px',
  },
  barFill: {
    display: 'block',
    height: '100%',
  },
  skillPct: {
    fontSize: font.sm,
    fontWeight: '600',
    minWidth: '38px',
    textAlign: 'right' as const,
  },
  skillCount: {
    fontSize: font.sm,
    color: colors.textHint,
    minWidth: '42px',
    textAlign: 'right' as const,
  },
}
