'use client'

/**
 * Re-open a mini-exam the student has already sat.
 *
 * The stored row holds only the parameter draw and the raw answers, so the paper
 * is REBUILT here: re-render each question with its stored params, then re-grade
 * the stored answers with the same pure functions the live runner uses. That is
 * what makes this screen identical to the one shown at submit.
 *
 * The score shown is the STORED one, not the re-graded total — if a grader fix
 * or a question edit has landed since, the review reflects current grading but
 * the recorded score (the one in the history and any trend) does not move.
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { getSession } from '../../../../lib/auth'
import { QUESTION_COLUMNS, type QuestionRow, type Tier } from '../../../../lib/exam/examPaper'
import { rehydratePaper, parsePaperSnapshot, type RehydratedPaper } from '../../../../lib/exam/examSession'
import type { CalculatorMode } from '../../../../lib/exam/assembler'
import ExamReview, { BackToDashboard } from '../../../../components/exam/ExamReview'
import { colors, font, primaryButton } from '../../../../lib/styles'

const pageStyle: React.CSSProperties = {
  maxWidth: 640, margin: '0 auto', padding: '24px 20px 64px',
  display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100dvh',
}

type SessionRow = {
  id: string
  created_at: string
  tier: Tier
  calculator: CalculatorMode
  marks_earned: number
  marks_total: number
  paper: unknown
}

export default function ExamSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'unreadable'>('loading')
  const [row, setRow] = useState<SessionRow | null>(null)
  const [paper, setPaper] = useState<RehydratedPaper | null>(null)

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session) { router.push('/student'); return }

      // RLS scopes this to the caller's own sessions, so a mistyped or someone
      // else's id simply returns nothing — no separate ownership check needed.
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('id, created_at, tier, calculator, marks_earned, marks_total, paper')
        .eq('id', sessionId)
        .maybeSingle()
      if (error || !data) { setState('notfound'); return }

      const snapshot = parsePaperSnapshot((data as SessionRow).paper)
      if (!snapshot) { setRow(data as SessionRow); setState('unreadable'); return }

      const ids = snapshot.questions.map(q => q.id)
      const { data: qs } = await supabase
        .from('questions')
        .select(QUESTION_COLUMNS)
        .in('id', ids)

      const byId = new Map<string, QuestionRow>(((qs ?? []) as QuestionRow[]).map(q => [q.id, q]))
      setRow(data as SessionRow)
      setPaper(rehydratePaper(snapshot, byId))
      setState('ready')
    })()
  }, [sessionId])

  if (state === 'loading') {
    return <main style={pageStyle}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  if (state === 'notfound') {
    return (
      <main style={pageStyle}>
        <BackToDashboard onClick={() => router.push('/student/dashboard')} />
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Paper not found</h1>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          This mini-exam doesn&apos;t exist, or it isn&apos;t yours.
        </p>
        <button onClick={() => router.push('/student/exam')} style={{ ...primaryButton }}>Go to mini-exams</button>
      </main>
    )
  }

  // The row exists but its paper can't be read — still show the score, which is
  // stored in its own columns and doesn't depend on the snapshot.
  if (state === 'unreadable' || !paper || !row) {
    const pct = row && row.marks_total > 0 ? Math.round((row.marks_earned / row.marks_total) * 100) : 0
    return (
      <main style={pageStyle}>
        <BackToDashboard onClick={() => router.push('/student/dashboard')} />
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Exam review</h1>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          You scored <strong>{row?.marks_earned} / {row?.marks_total}</strong> ({pct}%). The questions from this paper
          can&apos;t be shown.
        </p>
        <button onClick={() => router.push('/student/exam')} style={{ ...primaryButton }}>Go to mini-exams</button>
      </main>
    )
  }

  const missing = paper.missingQuestionIds.length
  const sat = new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main style={pageStyle}>
      {/* Back link stays the first thing on the page, as on every exam screen. */}
      <BackToDashboard onClick={() => router.push('/student/dashboard')} />
      <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>Sat on {sat}</p>
      <ExamReview
        items={paper.items}
        results={paper.results}
        answers={paper.answers}
        // The STORED score, so it can't drift from the history list. The band
        // around it is re-derived rather than stored — it is an estimate about
        // marks we never saw, so it SHOULD improve as the estimate does, and
        // nothing depends on it holding still.
        score={{ earned: row.marks_earned, total: row.marks_total, unknown: paper.unknown }}
        tier={row.tier}
        mode={row.calculator}
        timing={paper.meta}
        projectedCaption="What this paper did to your skill map, counted from no prior practice. One paper mostly moves skills to in progress — mastery is confirmed over repeated sessions."
        notice={missing > 0
          ? `${missing} question${missing === 1 ? '' : 's'} from this paper ${missing === 1 ? 'is' : 'are'} no longer available, so ${missing === 1 ? 'it is' : 'they are'} not shown below. Your score is unchanged.`
          : undefined}
        footer={
          <button onClick={() => router.push('/student/exam')} style={{ ...primaryButton }}>New mini-exam</button>
        }
      />
    </main>
  )
}
