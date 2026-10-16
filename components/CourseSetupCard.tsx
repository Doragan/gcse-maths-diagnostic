'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { courseIdFor, type Qualification } from '../data/courses'
import { applyAccountCourse } from '../lib/skills/accountCourse'
import {
  TARGET_GRADES, tierForTargetGrade, dismissCoursePrompt,
} from '../lib/skills/courseSetup'
import { QUALIFICATIONS, qualificationLabel, DEFAULT_QUALIFICATION } from '../lib/skills/qualificationPreference'
import { colors, font, radius, card, secondaryButton, sectionTitle } from '../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// "Which exam are you sitting?", asked on the dashboard.
//
// Shown only to a student whose ACCOUNT has no course yet, and dismissible.
// Deliberately NOT part of signup: the measured weak point is the day-1 to
// day-2 return, so putting questions in front of someone before they have done
// any maths spends the scarcest thing we have to ask for something that can be
// asked at any point.
//
// Two questions, and the second does double duty — see courseSetup.ts for why a
// target grade is asked instead of a tier.
//
// Answering writes to the account and takes effect in this browser at once;
// "Not sure yet" dismisses WITHOUT writing, because a guess stored here is
// indistinguishable later from a choice the student actually made, and the
// per-browser default already serves them correctly in the meantime.
// ─────────────────────────────────────────────────────────────────────────────

export default function CourseSetupCard({
  studentId,
  onDone,
}: {
  studentId: string
  /** Called once the card should stop being shown, answered or not. */
  onDone: () => void
}) {
  const [qualification, setQualification] = useState<Qualification>(DEFAULT_QUALIFICATION)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function choose(grade: number) {
    setError(null)
    setSaving(true)
    const tier = tierForTargetGrade(grade)
    const courseId = courseIdFor(qualification, tier)
    try {
      const { error: writeError } = await supabase
        .from('students')
        .update({ course_id: courseId })
        .eq('id', studentId)
      if (writeError) throw new Error(writeError.message)

      // Take effect now rather than on the next profile fetch, so the skills
      // map and practice pool match the answer by the time they are opened.
      applyAccountCourse({ course_id: courseId })
      trackEvent('course_setup_answered', { qualification, tier, target_grade: grade })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your course')
    } finally {
      setSaving(false)
    }
  }

  function decline(reason: 'not_sure' | 'not_now') {
    dismissCoursePrompt()
    trackEvent('course_setup_declined', { reason })
    onDone()
  }

  return (
    <div style={card}>
      <h2 style={sectionTitle}>Which exam are you sitting?</h2>
      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
        It sets which skills you practise. You can change it any time in your
        account settings.
      </p>

      {QUALIFICATIONS.length > 1 && (
        <div style={styles.row} role="group" aria-label="Which qualification are you sitting?">
          {QUALIFICATIONS.map(q => (
            <button
              key={q}
              onClick={() => setQualification(q)}
              aria-pressed={qualification === q}
              disabled={saving}
              style={{
                ...styles.option,
                background: qualification === q ? colors.primary : colors.card,
                borderColor: qualification === q ? colors.primary : colors.borderStrong,
                color: qualification === q ? '#ffffff' : colors.textPrimary,
              }}
            >
              {qualificationLabel(q)}
            </button>
          ))}
        </div>
      )}

      {/* The tier question, asked as something a student can actually answer. */}
      <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '16px 0 0', fontWeight: '600' }}>
        What grade are you aiming for?
      </p>
      <div style={styles.row} role="group" aria-label="What grade are you aiming for?">
        {TARGET_GRADES.map(g => (
          <button
            key={g}
            onClick={() => choose(g)}
            disabled={saving}
            style={{ ...styles.option, minWidth: '44px', background: colors.card, borderColor: colors.borderStrong, color: colors.textPrimary }}
          >
            {g}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '12px 0 0' }}>{error}</p>
      )}

      <div style={{ ...styles.row, marginTop: '16px' }}>
        <button
          onClick={() => decline('not_sure')}
          disabled={saving}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.sm }}
        >
          I&rsquo;m not sure yet
        </button>
        <button
          onClick={() => decline('not_now')}
          disabled={saving}
          style={{ ...styles.link }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  row: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '12px' },
  option: {
    padding: '8px 14px',
    borderRadius: radius.full,
    border: '1px solid',
    fontSize: font.base,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  link: {
    background: 'none',
    border: 'none',
    padding: '8px 4px',
    color: colors.textHint,
    fontSize: font.sm,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
