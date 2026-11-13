'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { skillsById } from '../../../lib/skills/skillGraph'
import { slugToSkillId, investigatePath } from '../../../lib/skills/slug'
import { getBriefing, resolveBriefing } from '../../../data/skillBriefings'
import type { MethodStep } from '../../../data/skillBriefings'
import { hasInvestigation } from '../../../data/investigations'
import {
  getExamProfile, dressedFramings, bareClaim, chainClaim, calcClaim,
  sliceProvenance, codedBoards, answerFormClaim, kindClaim, type Tier,
} from '../../../lib/skills/examProfile'
import { getTier, setTier as persistTier } from '../../../lib/skills/tierPreference'
import {
  judgedCorrectly, orderedPair, methodOptions, firstUnansweredStep, type Judgement,
} from '../../../lib/skills/briefingQuiz'
import { splitExpressions } from '../../../lib/skills/mathPhrases'
import {
  getBoard, setBoard as persistBoard, boardLabel, DEFAULT_BOARD,
} from '../../../lib/skills/boardPreference'
import {
  getQualification, DEFAULT_QUALIFICATION,
} from '../../../lib/skills/qualificationPreference'
import type { Qualification } from '../../../data/courses'
import { getStudentProfile } from '../../../lib/auth'
import { isPaidStudent } from '../../../lib/entitlements'
import { trackEvent, getSessionId } from '../../../lib/analytics'
import { colors, font, radius, primaryButton, secondaryButton, inputStyle } from '../../../lib/styles'
import type { Figure } from '../../../lib/skills/briefingFigures'

// ─────────────────────────────────────────────────────────────────────────────
// An exam briefing for one skill — what the exam does with it, how to spot it,
//
// Section order is deliberate and follows what a stuck student needs first:
//   recognise -> confusable -> judge some stems -> method -> check
// The derived exam profile sits near the end, just before practice: it is the
// most defensible content on the page but it answers "what should I expect",
// not "what do I do now", so it reads as context rather than an opener.
//
// Reachable from /skills, and from the prompt shown after a wrong answer on a
// skill that has one.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An authored diagram.
 *
 * The markup is built by lib/skills/briefingFigures and lives in this repo —
 * it never comes from the database, a student, or a question. briefingFigures
 * .test.ts holds every authored figure to shapes and text: no script, no
 * external reference, no <image>, `currentColor` only. That is what makes
 * rendering it as raw markup safe, and the test is the thing keeping it true.
 *
 * role="img" with the alt text means a screen reader gets the same content the
 * diagram is carrying, rather than a pile of unlabelled shapes.
 */
/**
 * Text with its short expressions held on one line.
 *
 * Without this an expression breaks wherever the column ends — "−2 ≤ x <"
 * then "3" on the next line — and the reader has to put it back together.
 * splitExpressions decides what counts as an expression; this only wraps.
 */
function MathText({ children }: { children: string }) {
  return (
    <>
      {/* The separating space sits OUTSIDE the span: inside it, the space
          before an expression became unbreakable too, taking the preceding
          word down with it. */}
      {splitExpressions(children).flatMap((seg, i) => [
        i > 0 ? ' ' : null,
        <span key={i} style={seg.nowrap ? { whiteSpace: 'nowrap' } : undefined}>{seg.text}</span>,
      ])}
    </>
  )
}

/**
 * A diagram in its own framed box, or — `bare` — one sitting inside a box
 * that is already framed, where a second border would be a box in a box.
 */
/**
 * One step: what to do, why, and what goes wrong, with the worked line for
 * this step beside it.
 *
 * Shared by the single-method list and the routes, which differ in what
 * surrounds a step and not in how a step is written.
 */
function MethodStepBody(
  { step, verdict }: { step: MethodStep; verdict?: React.ReactNode },
) {
  return (
    <div style={styles.stepBody}>
      <div>
        {verdict}
        <p style={styles.stepDo}><MathText>{step.do}</MathText></p>
        <p style={styles.stepSub}>
          <span style={{ ...styles.lbl, color: colors.primary }}>Why</span>
          <MathText>{step.because}</MathText>
        </p>
        <p style={{ ...styles.stepSub, marginBottom: 0 }}>
          <span style={{ ...styles.lbl, color: colors.warningText }}>Watch</span>
          <MathText>{step.watch}</MathText>
        </p>
      </div>
      {step.example && <p style={styles.stepExample}><MathText>{step.example}</MathText></p>}
    </div>
  )
}

function BriefingFigure({ figure, bare }: { figure: Figure; bare?: boolean }) {
  return (
    <span
      style={bare ? { ...styles.figure, ...styles.figureBare } : styles.figure}
      role="img"
      aria-label={figure.alt}
      dangerouslySetInnerHTML={{ __html: figure.svg }}
    />
  )
}

type Rating = 'useful' | 'not_useful'

/**
 * The three jobs a student is here to do, in the order they do them.
 * Named for the job, not for what the content is filed under.
 */
type Stage = 'spot' | 'do' | 'check'

const STAGES: { id: Stage; label: string; blurb: string }[] = [
  { id: 'spot',  label: 'Spot it',  blurb: 'Recognising it, and telling it apart' },
  { id: 'do',    label: 'Do it',    blurb: 'The method, worked through one question' },
  { id: 'check', label: 'Check it', blurb: 'Catching a wrong answer before you hand it in' },
]

export default function SkillBriefingPage() {
  const router = useRouter()
  const params = useParams()
  const slug = String(params.slug ?? '')

  const skillId = slugToSkillId(slug)
  const skill = skillId ? skillsById[skillId] : null
  const briefing = skillId ? getBriefing(skillId) : null

  const [tier, setTierState] = useState<Tier>('foundation')
  const [board, setBoardState] = useState<string>(DEFAULT_BOARD)
  const [qualification, setQualificationState] = useState<Qualification>(DEFAULT_QUALIFICATION)
  const [recent, setRecent] = useState<{ correct: boolean }[] | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  /** Whether this student can drill one chosen skill — a premium focus mode. */
  const [canFocus, setCanFocus] = useState(false)

  /**
   * What the student called each stem, by index — not merely which ones have
   * been opened.
   *
   * The section used to be a reveal: press a button, be told the answer. A
   * student could read all four and never commit to anything, which is the one
   * thing this section exists to make them do. Holding their actual call is
   * what lets the page tell them whether they were right.
   */
  const [judged, setJudged] = useState<Record<number, Judgement>>({})

  /** Which comparison card has been sorted, and what the student picked. */
  const [sorted, setSorted] = useState<Record<string, number>>({})

  /**
   * Which method step's question has been answered, and which option was
   * picked — step index to option index.
   *
   * Same argument as `judged` one section up, applied to the method: a list of
   * steps read top to bottom is something to agree with. A step that carries
   * `nextMoveDistractors` asks what the next move is before it opens, and the
   * steps after it stay closed until it does. Any answer opens it, right or
   * wrong: this is a teaching gate, not a lock, and a stuck student must never
   * be unable to read on.
   */
  const [methodPicks, setMethodPicks] = useState<Record<number, number>>({})

  /**
   * The page is three stages, not six sections, because grouping by SECTION
   * would split recognising the question from telling it apart from its
   * neighbours — and that pair is the whole argument for the page. Grouping by
   * what the student is trying to do keeps them together.
   *
   * A `#do` or `#check` hash selects that stage on arrival, so a link fired
   * from a trap can land the student on the part that just went wrong rather
   * than at the top of a long page.
   */
  const [stage, setStage] = useState<Stage>('spot')

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    if (hash === 'spot' || hash === 'do' || hash === 'check') setStage(hash)
  }, [])

  function changeStage(next: Stage) {
    setStage(next)
    if (typeof window !== 'undefined') history.replaceState(null, '', `#${next}`)
    trackEvent('skill_briefing_stage', { skill: skillId, tier, stage: next })
  }

  /** The stage after this one, for the forward pointer. Null on the last. */
  const nextStage = STAGES[STAGES.findIndex(s => s.id === stage) + 1] ?? null

  const [rating, setRating]       = useState<Rating | null>(null)
  const [comment, setComment]     = useState('')
  const [replyTo, setReplyTo]     = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)

  // Tier and board both come from the browser, not the server — see
  // lib/skills/tierPreference and lib/skills/boardPreference. Read after mount
  // so the server-rendered markup and the first client render agree.
  useEffect(() => {
    const q = getQualification()
    setQualificationState(q)
    setTierState(getTier())
    // Board is resolved WITHIN the qualification: a board left in storage from
    // another qualification is ignored rather than scoping the panel to an exam
    // this student does not sit.
    setBoardState(getBoard(q))
  }, [])

  useEffect(() => {
    if (!skillId || !briefing) return
    trackEvent('skill_briefing_view', { skill: skillId, tier, board })
  }, [skillId, briefing, tier, board])

  // The student's recent attempts on this skill, plus whether they can
  // actually use skill-targeted practice. Best-effort: signed-out visitors
  // simply don't see the standing strip.
  useEffect(() => {
    if (!skillId) return
    ;(async () => {
      const profile = await getStudentProfile()
      if (!profile) { setRecent([]); return }
      setStudentId(profile.id)
      // Drilling one chosen skill is a premium focus mode (see selectFocus in
      // /practice). The CTA below has to know, or it promises something the
      // student will not get.
      setCanFocus(isPaidStudent(profile))
      const { data } = await supabase
        .from('practice_attempts')
        .select('correct, attempted_at')
        .eq('student_id', profile.id)
        .contains('skill_ids', [skillId])
        .order('attempted_at', { ascending: false })
        .limit(5)
      setRecent((data ?? []).map(a => ({ correct: Boolean(a.correct) })))
    })()
  }, [skillId])

  function changeTier(next: Tier) {
    setTierState(next)
    persistTier(next)
    setJudged({})      // the example set changes with the tier
    setSorted({})
    setMethodPicks({})  // and so does the step list, so the indices change meaning
    trackEvent('skill_briefing_tier_change', { skill: skillId, tier: next })
  }

  /**
   * The exam panel is the only thing on the page that changes with the board,
   * so the examples do not need resetting the way a tier change resets them.
   */
  function changeBoard(next: string) {
    setBoardState(next)
    persistBoard(next, qualification)
    trackEvent('skill_briefing_board_change', { skill: skillId, tier, board: next })
  }

  /**
   * The student's call on one stem. Recorded with whether it was right, which
   * is the measure of whether these pages teach recognition — a view count
   * never could be.
   */
  function judge(index: number, chose: Judgement, isThisSkill: boolean) {
    if (judged[index]) return                      // first answer stands
    setJudged(prev => ({ ...prev, [index]: chose }))
    trackEvent('skill_briefing_judge', {
      skill: skillId, tier, index, chose, correct: judgedCorrectly(chose, isThisSkill),
    })
  }

  /**
   * The student's call on what the next move is. Recorded with whether it was
   * right, which is the whole measure of whether gating a step beats showing
   * it — the thing docs/audit/31 Increment 1 exists to find out.
   */
  function pickMove(index: number, option: number, correct: boolean) {
    if (methodPicks[index] !== undefined) return    // first answer stands
    setMethodPicks(prev => ({ ...prev, [index]: option }))
    trackEvent('skill_briefing_method_choice', {
      skill: skillId, tier, step: index, option, correct,
    })
  }

  /** The student's pick on one comparison pair, by the skill it compares with. */
  function sortPair(otherSkillId: string, picked: number, correct: boolean) {
    if (sorted[otherSkillId] !== undefined) return
    setSorted(prev => ({ ...prev, [otherSkillId]: picked }))
    trackEvent('skill_briefing_pair_sort', { skill: skillId, tier, other: otherSkillId, correct })
  }

  /**
   * Record the rating the instant it is clicked.
   *
   * It used to ride along with the comment form and only reach analytics when
   * "Send feedback" was pressed, which threw away every rating from a student
   * who clicked a thumb and stopped there — almost certainly most of them.
   * The rating is the measurement that matters; the comment is a bonus.
   */
  function rate(value: Rating) {
    if (rating === value) return
    setRating(value)
    trackEvent('skill_briefing_rating', { skill: skillId, tier, board, rating: value, stage })
  }

  /** Post the optional free text. The rating is already recorded by `rate`. */
  async function sendComment() {
    if (sending || !comment.trim()) return
    setSending(true)

    {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:   comment.trim(),
            category:  rating === 'useful' ? 'praise' : rating === 'not_useful' ? 'idea' : 'other',
            context:   `skill_briefing:${skillId}:${tier}`,
            email:     replyTo.trim() || null,
            userId:    studentId,
            sessionId: getSessionId(),
          }),
        })
      } catch {
        // Fail silently — the student sees the thank-you either way.
      }
    }

    setSending(false)
    setSent(true)
  }

  // ── Unknown skill, or a skill with no briefing written yet ────────────────────
  if (!skillId || !skill) {
    return (
      <main style={styles.page}>
        <h1 style={styles.title}>Skill not found</h1>
        <p style={styles.muted}>
          We don&apos;t have a skill at this address. It may have been renamed.
        </p>
        <button onClick={() => router.push('/practice')} style={{ ...secondaryButton, width: 'auto' }}>
          Go to practice
        </button>
      </main>
    )
  }

  if (!briefing) {
    return (
      <main style={styles.page}>
        <p style={styles.kicker}>{skill.topic}</p>
        <h1 style={styles.title}>{skill.name}</h1>
        <p style={styles.muted}>
          There&apos;s no exam briefing for this skill yet — we&apos;re writing them a few
          skills at a time. You can still practise it.
        </p>
        <button
          onClick={() => router.push(`/practice?skillId=${skillId}`)}
          style={{ ...primaryButton, width: 'auto' }}
        >
          Practise {skill.name.toLowerCase()}
        </button>
      </main>
    )
  }

  const g = resolveBriefing(briefing, tier)
  /**
   * The step whose question is open, or -1 when none is — every gated step has
   * been answered, or this briefing gates none and the method reads straight
   * through exactly as it did before.
   */
  const askingAt = firstUnansweredStep(skillId, g.steps, methodPicks)
  // Headings name the skill rather than saying "it", and reach it through
  // "a question on <name>" rather than "<name> question". Not every skill
  // name is a noun: "understanding straight line graphs questions" was the
  // first one to break the old phrasing, and an article in front of it
  // ("an understanding straight line graphs question") only made it worse.
  const lowerName = skill.name.toLowerCase()
  /**
   * Scopes the exam panel, and only the exam panel — the authored material
   * above it is the same whichever board you sit.
   *
   * Rendered in BOTH branches of that panel: a student who switches to a board
   * with too few coded papers lands on the "not enough papers" message, and
   * needs the control to still be there to switch back.
   *
   * Scoped to the student's QUALIFICATION, chosen on /skills and stored per
   * browser (see qualificationPreference). Defaults to the generic GCSE
   * experience, and a course on a signed-in account will override it there.
   * Without the scope this offers every coded board, which once meant putting
   * iGCSE in front of GCSE students.
   */
  const boardSwitch = (
    <div style={styles.tierSwitch} role="group" aria-label="Which exam board are you sitting?">
      {codedBoards(qualification).map(b => (
        <button
          key={b}
          onClick={() => changeBoard(b)}
          aria-pressed={board === b}
          style={{
            ...styles.tierBtn,
            background: board === b ? colors.card : 'transparent',
            color: board === b ? colors.textPrimary : colors.textHint,
            boxShadow: board === b ? '0 1px 2px rgba(16,24,40,.09)' : 'none',
            fontWeight: board === b ? '650' : '500',
          }}
        >
          {boardLabel(b)}
        </button>
      ))}
    </div>
  )

  const profile = getExamProfile(skillId, board, tier)
  const showProfile = profile?.sufficient ?? false
  const provenance = sliceProvenance(board, tier)
  const dressed = profile ? dressedFramings(profile) : []
  const dressedTotal = dressed.reduce((s, d) => s + d.count, 0)

  return (
    <main style={styles.page}>

      <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
        <button
          onClick={() => router.back()}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        {/* A real link, not a router.push — this is the one internal path to
            the index, and it should be crawlable. */}
        <a
          href="/skills"
          onClick={() => trackEvent('skill_briefing_index_click', { skill: skillId, tier })}
          style={{
            ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}
        >
          All skills
        </a>
      </div>

      {/* ── Title and standing ─────────────────────────────────────────────
          The tier switch lives up here as a small setting rather than a
          full-width control of its own. It is a once-per-student choice that
          persists, and when it was styled like the stage tabs — blue when
          selected, white when not — the two read as the same kind of thing and
          the navigation stopped looking like navigation. */}
      <section style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            {/* "Exam briefing" rather than "guide": a guide implies a full
                tutorial that teaches the topic from scratch, and this does not
                do that. It prepares you for how the skill is examined. */}
            <p style={styles.kicker}>Exam briefing · {skill.topic}</p>
            <h1 style={styles.title}>{skill.name}</h1>
          </div>
          <div style={styles.tierSwitch} role="group" aria-label="Which paper are you sitting?">
            {(['foundation', 'higher'] as Tier[]).map(t => (
              <button
                key={t}
                onClick={() => changeTier(t)}
                aria-pressed={tier === t}
                style={{
                  ...styles.tierBtn,
                  background: tier === t ? colors.card : 'transparent',
                  color: tier === t ? colors.textPrimary : colors.textHint,
                  boxShadow: tier === t ? '0 1px 2px rgba(16,24,40,.09)' : 'none',
                  fontWeight: tier === t ? '650' : '500',
                }}
              >
                {t === 'foundation' ? 'Foundation' : 'Higher'}
              </button>
            ))}
          </div>
        </div>
        <p style={{ ...styles.muted, marginBottom: '14px' }}>{g.summary}</p>

        {/* A quiet line, not a banner. This page is for a student who has the
            idea and wants the exam shape of it; the investigation is for one
            who does not, and only they should take the detour. */}
        {hasInvestigation(skillId) && (
          <p style={{ ...styles.muted, marginBottom: '14px' }}>
            New to {lowerName}?{' '}
            <a
              href={investigatePath(skillId)}
              onClick={() => trackEvent('investigation_prompt_click', {
                skill: skillId, from: 'briefing',
              })}
              style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
            >
              Work it out for yourself first →
            </a>
          </p>
        )}

        {recent && recent.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={styles.dots}>
              {[...recent].reverse().map((a, i) => (
                <span
                  key={i}
                  style={{
                    width: '9px', height: '9px', borderRadius: '50%',
                    background: a.correct ? colors.success : colors.dangerBorder,
                    display: 'inline-block',
                  }}
                />
              ))}
            </span>
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
              {recent.filter(a => a.correct).length} of your last {recent.length} correct
            </span>
          </div>
        )}
      </section>


      {/* ── Stage tabs ───────────────────────────────────────────────────
          A genuine tab strip: numbered, underlined, and sitting directly on
          the content it governs with no gap. Filled pills read as a toggle —
          "pick one setting" — which is what made these indistinguishable from
          the tier switch. An underline reads as "this panel belongs to me".
          Numbering also tells a student arriving fresh that there are three
          parts and which one they are on. */}
      <nav style={styles.tabs} aria-label="Which part of this skill">
        {STAGES.map((s, i) => {
          const on = stage === s.id
          return (
            <button
              key={s.id}
              onClick={() => changeStage(s.id)}
              aria-current={on ? 'page' : undefined}
              style={{
                ...styles.tab,
                color: on ? colors.primaryHover : colors.textSecondary,
                borderBottomColor: on ? colors.primary : 'transparent',
                background: on ? colors.card : 'transparent',
              }}
            >
              <span style={{
                ...styles.tabNum,
                background: on ? colors.primary : colors.border,
                color: on ? '#ffffff' : colors.textSecondary,
              }}>
                {i + 1}
              </span>
              <span style={{ fontWeight: on ? '700' : '600', fontSize: font.md }}>{s.label}</span>
            </button>
          )
        })}
      </nav>

      {/* One line naming what this stage is for, plus a forward pointer. The
          pointer is the fix for "a student may not realise there is more":
          every stage advertises the next one by name. */}
      <p style={styles.stageBlurb}>
        {stage === 'do' && g.routes
          ? 'The method for each kind of question'
          : STAGES.find(s => s.id === stage)!.blurb}
      </p>

      {stage === 'spot' && g.higherNote && (
        <section style={{ ...styles.card, background: colors.warningLight, borderColor: colors.warningBorder }}>
          <p style={{ ...styles.h, color: colors.warningText }}>What changes on Higher</p>
          <p style={{ fontSize: font.base, color: colors.textPrimary, margin: 0 }}>{g.higherNote.text}</p>
          {g.higherNote.example && (
            <p style={{ ...styles.specimen, borderColor: colors.warningBorder, background: '#fffdf5' }}>
              {g.higherNote.example}
            </p>
          )}
        </section>
      )}

      {/* ══ SPOT IT ═══════════════════════════════════════════════════════
          Recognise, tell apart, then judge some stems. These three stay
          together because the distinction between a skill and its neighbour
          is only meaningful alongside the cues for the skill itself. */}

      {/* ── Recognise ──────────────────────────────────────────────────────
          Each cue carries an optional fragment showing the pattern as it
          appears on a paper. A cue on its own describes a pattern in the
          abstract, which is easy to agree with and hard to spot in the exam. */}
      {stage === 'spot' && (
      <section style={styles.card}>
        <p style={styles.h}>Recognising a question on {lowerName}</p>
        <ul style={{ ...styles.list, gap: '14px' }}>
          {g.recognise.map((r, i) => (
            <li key={i} style={styles.li}>
              {r.text}
              {/* One container, because on the paper they are one question:
                  the fragment names what to find and the diagram is what it
                  is found from. Two stacked boxes read as a question and an
                  unrelated illustration. */}
              {r.example ? (
                <span style={styles.specimen}>
                  {r.example}
                  {r.figure && <BriefingFigure figure={r.figure} bare />}
                </span>
              ) : (
                r.figure && <BriefingFigure figure={r.figure} />
              )}
            </li>
          ))}
        </ul>
      </section>
      )}

      {/* ── Confusable with ──────────────────────────────────────────────────
          Each line is labelled with the skill it describes, rather than a
          paragraph naming both. The student should never have to work out
          which half of a sentence belongs to which skill. */}
      {stage === 'spot' && (
      <section style={styles.card}>
        <p style={styles.h}>Is it {lowerName}, or something else?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {g.confusableWith.map(c => {
            const otherName = skillsById[c.skillId]?.name ?? c.skillId
            return (
              <div key={c.skillId} style={styles.confuse}>
                <p style={styles.confuseTitle}>
                  <span style={{ color: colors.primary }}>{skill.name}</span>
                  <span style={{ color: colors.textHint, fontWeight: '400' }}> or </span>
                  <span style={{ color: colors.warningText }}>{otherName}</span>
                  <span style={{ color: colors.textHint, fontWeight: '400' }}>?</span>
                </p>

                <div style={styles.contrast}>
                  <span style={{ ...styles.contrastLabel, color: colors.primary }}>{skill.name}</span>
                  <span style={styles.contrastText}>{c.thisOne}</span>

                  <span style={{ ...styles.contrastLabel, color: colors.warningText }}>{otherName}</span>
                  <span style={styles.contrastText}>{c.theOther}</span>
                </div>

                {/* The minimal pair, in the same two-column grid as the
                    descriptions above it, so each question sits under the
                    skill it belongs to. Set apart as specimens because they
                    are questions off a paper, not commentary about them. */}
                {c.pair && (() => {
                  // Sorted first, read second. The pair is the one place on the
                  // page where the student can test the distinction they have
                  // just been given, so the labels stay off until they pick.
                  const options = orderedPair(skillId, c.skillId, c.pair)
                  const picked = sorted[c.skillId]
                  const done = picked !== undefined

                  return (
                    <div style={styles.pairGrid}>
                      <p style={styles.pairPrompt}>
                        {`Which of these is ${lowerName}?`}
                      </p>

                      {options.map((o, j) => {
                        const chosen = picked === j
                        const show = done
                        return (
                          <button
                            key={j}
                            onClick={() => sortPair(c.skillId, j, o.isThisSkill)}
                            disabled={done}
                            aria-pressed={chosen}
                            style={{
                              ...styles.pairOption,
                              cursor: done ? 'default' : 'pointer',
                              borderColor: show
                                ? (o.isThisSkill ? colors.successBorder : colors.border)
                                : colors.border,
                              background: show && o.isThisSkill ? colors.successLight : colors.card,
                            }}
                          >
                            <span style={styles.pairText}>{o.question}</span>
                            {show && (
                              <span style={{
                                ...styles.pairVerdict,
                                color: o.isThisSkill ? colors.successText : colors.warningText,
                              }}>
                                {o.isThisSkill ? skill.name : otherName}
                                {chosen && ' · you picked this'}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}

                <p style={styles.ask}>
                  <span style={styles.askLabel}>Ask yourself</span>
                  {c.ask}
                </p>
              </div>
            )
          })}
        </div>
      </section>
      )}

      {/* ── Judge the stems ──────────────────────────────────────────────── */}
      {stage === 'spot' && (
      <section style={styles.card}>
        <p style={styles.h}>Which of these are questions on {lowerName}?</p>
        <p style={{ ...styles.hint, marginBottom: '12px' }}>
          Decide before you look. Not all of them are — that&apos;s the point.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {g.examples.map((ex, i) => {
            const chose = judged[i]
            const isOpen = chose !== undefined
            const wasRight = isOpen && judgedCorrectly(chose, ex.isThisSkill)
            const other = ex.actuallySkillId ? skillsById[ex.actuallySkillId] : null
            return (
              <div key={i} style={styles.example}>
                <p style={styles.exampleStem}>{ex.stem}</p>
                {ex.figure && <BriefingFigure figure={ex.figure} />}

                {!isOpen ? (
                  // Two buttons rather than "show me": the student has to
                  // commit before the page tells them anything. Reading the
                  // answer teaches nothing about recognising it.
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => judge(i, 'yes', ex.isThisSkill)}
                      style={{ ...secondaryButton, width: 'auto', padding: '7px 14px', fontSize: font.base }}
                    >
                      {skill.name} question
                    </button>
                    <button
                      onClick={() => judge(i, 'no', ex.isThisSkill)}
                      style={{ ...secondaryButton, width: 'auto', padding: '7px 14px', fontSize: font.base }}
                    >
                      Another kind of question
                    </button>
                  </div>
                ) : (
                  <div style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: '10px',
                    marginTop: '2px',
                  }}>
                    {/* Their call first, then what it actually is. Getting it
                        wrong is the useful case, so it is named plainly rather
                        than softened — but the verdict beside it carries the
                        teaching, not the tick. */}
                    <p style={{
                      ...styles.judgement,
                      color: wasRight ? colors.successText : colors.warningText,
                    }}>
                      {wasRight ? '✓ You were right' : '✗ Not quite'}
                    </p>
                    <p style={{
                      ...styles.verdict,
                      color: ex.isThisSkill ? colors.successText : colors.warningText,
                      background: ex.isThisSkill ? colors.successLight : colors.warningLight,
                      borderColor: ex.isThisSkill ? colors.successBorder : colors.warningBorder,
                    }}>
                      {ex.isThisSkill
                        ? `Yes — ${skill.name.toLowerCase()}`
                        : `No — this is ${(other?.name ?? ex.actuallySkillId ?? 'something else').toLowerCase()}`}
                    </p>
                    <p style={styles.exampleCue}>{ex.cue}</p>

                    {/* The working, for a stem that IS the skill. It sits
                        behind the same reveal as the verdict: showing it up
                        front would answer the question the student is being
                        asked to judge. */}
                    {ex.worked && ex.worked.length > 0 && (
                      <ol style={styles.worked}>
                        {ex.worked.map((line, j) => (
                          <li key={j} style={styles.workedLine}><MathText>{line}</MathText></li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
      )}

      {/* ══ DO IT ═════════════════════════════════════════════════════════ */}
      {stage === 'do' && (
      <section style={styles.card}>
        <p style={styles.h}>How to answer a question on {lowerName}</p>

        {/* Some skills are asked from genuinely different starting points,
            and one numbered list run through all of them keeps changing
            subject. Those pages author routes instead: a method per kind of
            question, picked by looking at what you have been given.

            Routes are not gated. The gate hides the rest of a method until
            the student commits to the next move, which works on one thread
            and not on three — the answer to the first route is written out
            in plain sight as the first step of the second. */}
        {g.routes ? (
          <>
            <p style={{ ...styles.hint, marginBottom: '4px' }}>
              {['', 'One kind', 'Two kinds', 'Three kinds', 'Four kinds'][g.routes.length]
                ?? `${g.routes.length} kinds`} of question, each with its own first move. Work
              out which one you have been given, then follow that method.
            </p>
            {g.routes.map((r, ri) => (
              <div
                key={r.name}
                style={{
                  ...styles.route,
                  borderTop: ri === 0 ? 'none' : `1px solid ${colors.border}`,
                }}
              >
                <p style={styles.routeName}>
                  {r.higher && <span style={styles.routeHigher}>Higher</span>}
                  {r.name}
                </p>
                <p style={styles.routeWhen}>{r.when}</p>
                <div style={styles.methodRun}>
                  <p style={{ margin: 0 }}>
                    <span style={styles.methodRunLabel}>Worked on</span>
                    <MathText>{r.example}</MathText>
                  </p>
                  {r.figure && <BriefingFigure figure={r.figure} bare />}
                </div>
                {r.steps.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.step,
                      borderTop: i === 0 ? 'none' : `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={styles.stepN}>{i + 1}</div>
                    <MethodStepBody step={s} />
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : (
          <>
        <p style={{ ...styles.hint, marginBottom: g.methodExample ? 0 : 12 }}>
          {askingAt > -1
            ? 'Decide the next move before each step opens. Each step then says why it is there and where it goes wrong.'
            : 'Each step says why it is there and where it goes wrong.'}
        </p>

        {/* One question worked down the right-hand side, a line per step.
            The steps on their own describe the method in the abstract, which
            is what made the section read as something to agree with rather
            than something to do. */}
        {g.methodExample && (
          <p style={styles.methodRun}>
            <span style={styles.methodRunLabel}>Worked on</span>
            {g.methodExample}
          </p>
        )}
        {g.steps.map((s, i) => {
          const firstHigherStep = g.higherStepCount > 0
            && i === g.steps.length - g.higherStepCount

          // The section reveals in order: steps past the first unanswered
          // question are not rendered, because a method whose later steps are
          // on screen has already answered its own question.
          if (askingAt > -1 && i > askingAt) return null

          const options = methodOptions(skillId, i, s)
          const picked = methodPicks[i]
          const asking = i === askingAt
          const gotItRight = options && picked !== undefined && options[picked].isCorrect

          return (
          <div key={i}>
            {firstHigherStep && g.higherMethodExample && (
              <p style={{ ...styles.methodRun, marginTop: 14 }}>
                <span style={styles.methodRunLabel}>On Higher</span>
                {g.higherMethodExample}
              </p>
            )}
            <div style={{ ...styles.step, borderTop: i === 0 ? 'none' : `1px solid ${colors.border}` }}>
              {!(asking && options) && <div style={styles.stepN}>{i + 1}</div>}
              {asking && options ? (
                // Three options rather than "show me the next step". The
                // distractors are what a candidate actually does — usually
                // this step's own `watch`, or the step after it — so picking
                // one is a diagnosis rather than a guess.
                <div style={styles.move}>
                  <p style={styles.moveLabel}>
                    {i === 0 ? 'Before step 1' : `Before step ${i + 1}`}
                  </p>
                  <p style={styles.moveQ}>
                    {i === 0 ? 'What is the first move?' : 'What is the next move?'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((o, k) => (
                      <button
                        key={k}
                        onClick={() => pickMove(i, k, o.isCorrect)}
                        style={styles.moveOption}
                      >
                        <span style={styles.moveLetter}>{'ABC'[k]}</span>
                        <span><MathText>{o.text}</MathText></span>
                      </button>
                    ))}
                  </div>
                  <p style={styles.moveHint}>
                    Pick the one you would write down. The step opens either way.
                  </p>
                </div>
              ) : (
              <MethodStepBody
                step={s}
                verdict={options && picked !== undefined && (
                  // Their call, named plainly — the same way the judged
                  // stems do it. The step below carries the teaching; this
                  // line only says whether they had it.
                  <p style={{
                    ...styles.judgement,
                    color: gotItRight ? colors.successText : colors.warningText,
                  }}>
                    {gotItRight ? '✓ That was the move' : '✗ Not the move — here it is'}
                  </p>
                )}
              />
              )}
            </div>
          </div>
          )
        })}
          </>
        )}
      </section>
      )}

      {/* ══ CHECK IT ══════════════════════════════════════════════════════
          The self-check, then what the papers actually show. Both answer
          "am I right / what should I expect", which is one job. */}
      {stage === 'check' && (
      <section style={{ ...styles.card, background: colors.cardAlt }}>
        <p style={styles.h}>Before you write your answer down, check:</p>
        <ul style={{ ...styles.list, listStyle: 'none', paddingLeft: 0 }}>
          {g.check.map((c, i) => (
            <li key={i} style={{ ...styles.li, display: 'flex', gap: '10px' }}>
              <span style={styles.checkMark}>?</span>
              <span style={{ flex: 1 }}>{c}</span>
            </li>
          ))}
        </ul>
      </section>
      )}

      {/* ── Tier 3: derived from the coded papers ────────────────────────── */}
      {stage === 'check' && showProfile && profile && (
        <section style={{ ...styles.card, background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div style={styles.panelHead}>
            <p style={{ ...styles.h, margin: 0 }}>How {lowerName} shows up on the exam paper</p>
            {boardSwitch}
          </div>

          <div style={styles.stats}>
            <Stat n={`${profile.papersSeen}`} sub={`/ ${profile.papersTotal}`} label="papers it appeared in" />
            <Stat n={`${profile.marks}`} label="marks in questions using it" />
            <Stat
              n={profile.markRange[0] === profile.markRange[1]
                ? `${profile.markRange[0]}`
                : `${profile.markRange[0]}–${profile.markRange[1]}`}
              label="marks per question"
            />
            {profile.framingCoded > 0 && (
              <Stat n={`${profile.barePct}`} sub="%" label="asked straight out" />
            )}
          </div>

          {dressedTotal > 0 && (
            <>
              <div style={styles.bar} role="img" aria-label="How the question is framed">
                {dressed.map((d, i) => (
                  <span
                    key={d.key}
                    style={{
                      width: `${(100 * d.count) / dressedTotal}%`,
                      background: BAR_SHADES[i % BAR_SHADES.length],
                      display: 'block',
                    }}
                  />
                ))}
              </div>
              <div style={styles.legend}>
                {dressed.map((d, i) => (
                  <span key={d.key} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <i style={{
                      width: '8px', height: '8px', borderRadius: '2px',
                      background: BAR_SHADES[i % BAR_SHADES.length],
                      display: 'inline-block', marginRight: '5px',
                    }} />
                    {d.label} ({d.count})
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Only the claims this board’s coding supports. The OCR and
              Edexcel papers carry no framing, calculator or trap coding, so
              their panels lean on answer form and whether the skill stands
              alone — both recorded on every coded part, on every board. */}
          {(() => {
            const claims = [
              bareClaim(profile, skill.name),
              kindClaim(profile),
              answerFormClaim(profile),
              chainClaim(profile),
              calcClaim(profile),
            ].filter(Boolean) as string[]
            if (!claims.length) return null
            return (
              <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '14px 0 0' }}>
                <strong>{claims[0]}</strong>
                {claims.slice(1).map(c => ` ${c}`).join('')}
              </p>
            )
          })()}

          {provenance && (
            <p style={styles.provenance}>
              Derived from {provenance.papers.length} {board} {tier === 'higher' ? 'Higher' : 'Foundation'} papers
              {provenance.series.length ? ` (${provenance.series.join(', ')})` : ''}
            </p>
          )}
        </section>
      )}

      {stage === 'check' && !showProfile && (
        <section style={{ ...styles.card, background: colors.cardAlt }}>
          <div style={styles.panelHead}>
            <p style={{ ...styles.h, margin: 0 }}>How {lowerName} shows up on the exam paper</p>
            {boardSwitch}
          </div>
          {/* Built as a string rather than JSX text. Written the JSX way, the
              spaces around {lowerName} and the line break were being swallowed
              and it rendered as "…about tree diagramsyet." One string has no
              whitespace rules to get wrong. */}
          <p style={{ ...styles.muted, margin: 0 }}>
            {`We haven't been through enough ${board} ${tier === 'higher' ? 'Higher' : 'Foundation'} `
              + `papers to tell you anything useful about ${lowerName} yet. `
              + `We'd rather leave this out than guess.`}
          </p>
        </section>
      )}

      {/* ── On to the next stage ───────────────────────────────────────────
          Named, not a bare arrow. A student who reads one stage and stops was
          never told the other two existed; this says what is in them. */}
      {nextStage && (
        <button onClick={() => changeStage(nextStage.id)} style={styles.nextStage}>
          <span>
            <span style={{ ...styles.nextLabel, color: '#fff' }}>Next</span>
            <span style={{ fontWeight: '650', fontSize: font.md, color: '#fff' }}>
              {nextStage.label}
            </span>
          </span>
          <span style={{ fontSize: font.sm, color: '#fff' }}>
            {nextStage.blurb} →
          </span>
        </button>
      )}

      {/* ── Practise ───────────────────────────────────────────────────────
          Targeting one skill is a premium focus mode: /practice only honours
          ?skillId= for paid students and silently ignores it otherwise. The
          button used to promise "Practise ratio" to everyone and quietly hand
          free students a mixed session instead, which is the one behaviour
          worse than either honest option. Now it says what each will get, and
          matches the show-but-locked pattern /practice already uses.

          Shown on the LAST stage only. On "spot it" and "do it" the next
          step is the next stage, and a filled blue button offering to
          leave drowned that out — the briefing was competing with itself. */}
      {stage === 'check' && (
      <section style={styles.card}>
        <p style={styles.h}>
          {canFocus ? `Practise ${lowerName}` : 'Practise'}
        </p>

        {canFocus ? (
          <button
            onClick={() => {
              trackEvent('skill_briefing_practise', { skill: skillId, tier, targeted: true })
              router.push(`/practice?skillId=${skillId}`)
            }}
            style={primaryButton}
          >
            Practise {lowerName}
          </button>
        ) : (
          <>
            <p style={{ ...styles.muted, marginBottom: '12px' }}>
              A mixed session picked for you. Choosing one skill to drill is part of
              Premium.
            </p>
            <button
              onClick={() => {
                trackEvent('skill_briefing_practise', { skill: skillId, tier, targeted: false })
                router.push('/practice')
              }}
              style={primaryButton}
            >
              Start a practice session
            </button>
            <button
              onClick={() => {
                trackEvent('skill_briefing_upgrade_click', { skill: skillId, tier })
                // Carry what they were trying to do, so the upgrade page opens
                // by naming it rather than with a generic pitch.
                router.push(studentId ? `/student/upgrade?want=skill&skill=${skillId}` : '/student')
              }}
              style={{ ...secondaryButton, width: '100%', marginTop: '8px' }}
            >
              {studentId ? `Drill ${lowerName} on its own` : 'Sign in to drill one skill'}
            </button>
          </>
        )}
      </section>
      )}

      {/* ── Was this useful? ─────────────────────────────────────────────
          Always visible, on every stage, and the rating is recorded the
          moment it is clicked.

          Both of those are fixes rather than preferences. It used to be a
          collapsed section carrying the whole form, and the rating only
          reached analytics when "Send feedback" was pressed — so a student
          who opened it, clicked "Yes, useful" and stopped, which is the
          natural thing to do, recorded nothing at all. Across five days and
          39 page views this instrument captured zero ratings; a buried
          control that also discards the common interaction is enough to
          explain that on its own.

          The comment box only appears once a rating is given, so the resting
          height is a prompt and two buttons rather than ~460px of form. */}
      <section style={{ ...styles.card, borderColor: colors.primary }}>
        {sent ? (
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            ✓ Thanks — that goes straight to the person who wrote this page.
          </p>
        ) : (
          <>
            <p style={{ ...styles.h, marginBottom: '10px' }}>
              {rating ? 'Thanks. Anything you want to add?' : 'Was this useful?'}
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              {([['useful', '👍  Yes'], ['not_useful', '👎  Not really']] as [Rating, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => rate(value)}
                  aria-pressed={rating === value}
                  style={{
                    ...secondaryButton,
                    flex: 1,
                    borderColor: rating === value ? colors.primary : colors.borderStrong,
                    background: rating === value ? '#eff4ff' : colors.card,
                    color: rating === value ? colors.primaryHover : colors.textPrimary,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {rating && (
              <div style={{ marginTop: '14px' }}>
                <label htmlFor="briefing-comment" style={{ ...styles.hint, display: 'block', marginBottom: '5px' }}>
                  {rating === 'not_useful'
                    ? 'What would have helped instead?'
                    : 'What was missing, confusing, or worth keeping?'}
                </label>
                <textarea
                  id="briefing-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Optional — even one line is useful."
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px', lineHeight: 1.5 }}
                />

                <label htmlFor="briefing-reply" style={{ ...styles.hint, display: 'block', marginBottom: '5px' }}>
                  Email, if you&apos;d like a reply (optional)
                </label>
                <input
                  id="briefing-reply"
                  type="email"
                  value={replyTo}
                  onChange={e => setReplyTo(e.target.value)}
                  placeholder="you@example.com"
                  style={{ ...inputStyle, marginBottom: '12px' }}
                />

                <button
                  onClick={sendComment}
                  disabled={sending || !comment.trim()}
                  style={{
                    ...primaryButton,
                    opacity: sending || !comment.trim() ? 0.6 : 1,
                    cursor: sending || !comment.trim() ? 'default' : 'pointer',
                  }}
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  )
}

// ── Small presentational pieces ──────────────────────────────────────────────

function Stat({ n, sub, label }: { n: string; sub?: string; label: string }) {
  return (
    <div>
      <div style={styles.statN}>
        {n}{sub && <em style={styles.statSub}>{sub}</em>}
      </div>
      <div style={styles.statL}>{label}</div>
    </div>
  )
}

/** Framing bar shades — one hue, stepped, so it reads as a single breakdown. */
const BAR_SHADES = ['#2563eb', '#60a5fa', '#bfdbfe', '#dbeafe']

const styles: Record<string, React.CSSProperties> = {
  // Width is set by the LINE, not by the window. Measured on this page at 14px,
  // the average character is 6.2px wide, so a card this wide holds:
  //    640px page -> 90 characters   720 -> 103   880 -> 129
  // 880 was tried with the prose capped at 70ch to hold the line down, and the
  // cap is what the gap came from: text stopping 230px short of the card it sits
  // in, which reads as a column that gave up rather than as a measure. There is
  // no width that both fills an 880px card and keeps a sane line at this size,
  // so the card comes in to meet the line instead. Raising this again means
  // giving the extra width to the LAYOUT — a figure beside its cue rather than
  // under it — not to longer lines.
  page: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px 20px 64px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minHeight: '100dvh',
  },
  card: {
    background: colors.card,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    padding: '20px',
  },
  kicker: {
    fontSize: font.sm,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
    margin: '0 0 6px',
  },
  title: {
    fontSize: font['3xl'],
    fontWeight: '700',
    letterSpacing: '-0.02em',
    margin: '0 0 6px',
    color: colors.textPrimary,
  },
  h: {
    fontSize: font.md,
    fontWeight: '650',
    margin: '0 0 12px',
    color: colors.textPrimary,
  },
  muted: { fontSize: font.base, color: colors.textSecondary, margin: 0 },
  hint:  { fontSize: font.sm, color: colors.textHint, margin: 0 },

  stats: { display: 'flex', flexWrap: 'wrap', gap: '24px', margin: '0 0 14px' },
  statN: {
    fontSize: font['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.15,
  },
  statSub: { fontStyle: 'normal', fontSize: font.base, fontWeight: '600', color: colors.textSecondary },
  statL: { fontSize: font.sm, color: colors.textSecondary, marginTop: '1px' },

  bar: {
    display: 'flex',
    height: '7px',
    borderRadius: '4px',
    overflow: 'hidden',
    background: colors.border,
    margin: '3px 0 6px',
  },
  legend: {
    fontSize: font.sm,
    color: colors.textSecondary,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  provenance: {
    fontSize: font.sm,
    color: colors.textHint,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '9px',
    margin: '14px 0 0',
  },

  list: { margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' },
  li: { fontSize: font.base, color: colors.textPrimary, lineHeight: 1.55 },

  /**
   * A fragment shown as it would appear on a paper. Deliberately set apart from
   * the surrounding advice — it is a specimen, not another sentence of guidance,
   * and a student skimming should be able to tell the two apart at a glance.
   */
  // The figure sits where the specimen fragment would, and scales to the
  // column: the SVGs carry a viewBox and no width, so this cap is what decides
  // their size. 320px keeps a number line readable on a phone without the
  // diagram dominating the cue it belongs to.
  figure: {
    display: 'block',
    // The SVGs carry no width attribute on purpose, so they size to their
    // container. Inside the example card — a flex column with align-items:
    // flex-start — the box was shrink-to-fit and the diagram collapsed to 26px.
    width: '100%',
    maxWidth: '360px',
    // Centred in its column. The auto margins are what do it: inside the example
    // card the figure is a flex item, where align-items would otherwise pin it
    // left, and auto margins beat align-items on the cross axis.
    margin: '10px auto 0',
    padding: '10px 12px',
    background: colors.cardAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    color: colors.textPrimary,
  },

  /** Inside a specimen box, which already supplies the frame and the tint. */
  figureBare: {
    border: 'none',
    background: 'transparent',
    padding: '2px 0 0',
    margin: '8px auto 2px',
  },
  specimen: {
    display: 'block',
    marginTop: '6px',
    padding: '8px 12px',
    background: colors.cardAlt,
    borderLeft: `3px solid ${colors.borderStrong}`,
    borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
    fontSize: font.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 1.5,
  },

  confuse: {
    border: `1px solid ${colors.border}`,
    borderLeft: `3px solid ${colors.warning}`,
    borderRadius: radius.md,
    padding: '12px 14px',
  },
  confuseTitle: { fontWeight: '650', fontSize: font.base, margin: '0 0 10px' },

  /** Two labelled rows: skill name in the left column, its description right. */
  contrast: {
    display: 'grid',
    gridTemplateColumns: 'minmax(72px, auto) 1fr',
    columnGap: '12px',
    rowGap: '6px',
    alignItems: 'baseline',
  },
  contrastLabel: {
    fontSize: font.sm,
    fontWeight: '700',
    lineHeight: 1.5,
  },
  contrastText: {
    fontSize: font.base,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },

  // The minimal pair, below the descriptions and separated from them: same
  // grid, so the two questions line up under the same two labels.
  pairGrid: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: `1px dashed ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  pairPrompt: {
    fontSize: font.sm,
    fontWeight: '650',
    color: colors.textSecondary,
    margin: '0 0 2px',
  },
  // A full-width option rather than a labelled row: it has to read as
  // something to press, which a line of text beside a label never does.
  /**
   * The decision before a step opens. Deliberately not shaped like a step:
   * drawn as one it sat directly under the previous step's body and read as
   * more of it, with "What is the next move?" as its heading.
   */
  move: {
    flex: 1,
    background: '#f5f8ff',
    border: '1px solid #dbe6ff',
    borderRadius: radius.sm,
    padding: '14px 16px',
  },
  moveLabel: {
    margin: 0,
    fontSize: font.sm,
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.primaryHover,
  },
  moveQ: {
    margin: '2px 0 10px',
    fontSize: font.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moveHint: {
    margin: '10px 0 0',
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  /** An option to choose, lettered so it reads as a choice and not a list. */
  moveOption: {
    display: 'flex',
    // Top, not centre: on a phone an option runs to three lines and a letter
    // floating at its middle reads as punctuation rather than as a label.
    alignItems: 'flex-start',
    gap: '10px',
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderStrong}`,
    background: colors.card,
    fontFamily: 'inherit',
    fontSize: font.base,
    color: colors.textPrimary,
    cursor: 'pointer',
  },
  moveLetter: {
    flex: 'none',
    width: '22px', height: '22px',
    borderRadius: '50%',
    background: '#eff4ff',
    color: colors.primaryHover,
    fontSize: font.sm,
    fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pairOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    width: '100%',
    textAlign: 'left',
    padding: '9px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.card,
    fontFamily: 'inherit',
  },
  pairVerdict: { fontSize: font.sm, fontWeight: '650' },
  /** The call the student made, above the verdict that explains it. */
  judgement: { fontSize: font.sm, fontWeight: '650', margin: '0 0 6px' },
  // Italic, like the specimen fragments beside the recognition cues — these
  // are questions as a paper would print them, not our words about them.
  pairText: {
    fontSize: font.base,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  ask: {
    fontSize: font.base,
    color: colors.textPrimary,
    margin: '10px 0 0',
    paddingTop: '10px',
    borderTop: `1px solid ${colors.border}`,
    lineHeight: 1.5,
  },
  askLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: colors.textHint,
    marginRight: '7px',
  },

  example: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '14px 15px',
    background: colors.cardAlt,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'flex-start',
  },
  exampleStem: {
    fontSize: font.md,
    color: colors.textPrimary,
    margin: 0,
    lineHeight: 1.5,
  },
  verdict: {
    display: 'inline-block',
    fontSize: font.sm,
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: radius.full,
    border: '1px solid transparent',
    margin: '0 0 8px',
  },
  exampleCue: {
    fontSize: font.base,
    color: colors.textSecondary,
    margin: 0,
    lineHeight: 1.55,
  },

  // The working. Numbered, because the lines are a sequence rather than a list
  // of facts, and set on the card background so it reads as a worked answer
  // rather than more commentary.
  worked: {
    margin: '10px 0 0',
    // listStyleType is set explicitly: a reset in globals.css turns markers off
    // for every list, and these lines are a sequence — the numbers are the
    // point. Inherited defaults rendered them as four unnumbered sentences.
    listStyleType: 'decimal',
    padding: '10px 12px 10px 30px',
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    fontSize: font.base,
    color: colors.textPrimary,
    lineHeight: 1.6,
  },
  workedLine: { paddingLeft: '2px', marginBottom: '2px' },

  /** One kind of question, with its own method under it. */
  route: {
    marginTop: '16px',
    paddingTop: '14px',
  },
  routeName: {
    margin: 0,
    fontSize: font.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  routeHigher: {
    display: 'inline-block',
    marginRight: '8px',
    padding: '1px 7px',
    borderRadius: radius.full,
    background: '#eff4ff',
    color: colors.primaryHover,
    fontSize: font.sm,
    fontWeight: '700',
    verticalAlign: '2px',
  },
  routeWhen: {
    margin: '3px 0 0',
    fontSize: font.base,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  step: { display: 'flex', gap: '12px', padding: '14px 0' },
  // Method on the left, the worked line on the right. One column on a
  // phone, where side-by-side would leave both halves too narrow to read.
  stepBody: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '8px',
  },
  stepExample: {
    margin: 0,
    alignSelf: 'start',
    padding: '8px 11px',
    background: colors.cardAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    fontSize: font.base,
    color: colors.textPrimary,
    lineHeight: 1.5,
  },
  methodRun: {
    margin: '10px 0 2px',
    padding: '8px 12px',
    background: colors.cardAlt,
    borderLeft: `3px solid ${colors.primary}`,
    borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
    fontSize: font.base,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  methodRunLabel: {
    display: "inline-block",
    marginRight: "8px",
    fontSize: font.sm,
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.primary,
  },
  stepN: {
    flex: 'none',
    width: '24px', height: '24px',
    borderRadius: '50%',
    background: '#eff4ff',
    color: colors.primaryHover,
    fontSize: font.sm,
    fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepDo: { fontWeight: '650', fontSize: font.base, margin: '2px 0 7px', color: colors.textPrimary },
  stepSub: { fontSize: font.base, color: colors.textSecondary, margin: '0 0 6px', lineHeight: 1.55 },
  lbl: {
    fontSize: '10.5px',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    marginRight: '7px',
  },

  checkMark: {
    flex: 'none',
    width: '18px', height: '18px',
    borderRadius: '50%',
    background: colors.successLight,
    color: colors.successText,
    fontSize: font.sm,
    fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '2px',
  },

  dots: { display: 'inline-flex', gap: '4px', verticalAlign: 'middle' },

  /** Segmented control — a setting, deliberately quieter than the tab strip. */
  // The panel heading and its board switch. Wraps on a phone, so the switch
  // drops under the heading rather than squeezing it.
  panelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  tierSwitch: {
    flex: 'none',
    display: 'inline-flex',
    gap: '2px',
    padding: '3px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
  },
  tierBtn: {
    padding: '5px 11px',
    borderRadius: radius.sm,
    border: 'none',
    fontSize: font.sm,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },

  tabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    borderBottom: `2px solid ${colors.border}`,
    marginBottom: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '13px 8px',
    border: 'none',
    borderBottom: '3px solid',
    marginBottom: '-2px',
    borderRadius: `${radius.md} ${radius.md} 0 0`,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tabNum: {
    flex: 'none',
    width: '20px', height: '20px',
    borderRadius: '50%',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  stageBlurb: {
    margin: '0 0 4px',
    padding: '10px 4px 0',
    fontSize: font.base,
    color: colors.textSecondary,
  },

  nextStage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '3px',
    width: '100%',
    padding: '14px 18px',
    background: colors.primary,
    border: `1px solid ${colors.primary}`,
    boxShadow: `0 1px 2px rgba(16,24,40,.12)`,
    borderRadius: radius.lg,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  nextLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.primary,
    marginRight: '8px',
  },

}
