'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { skillsById } from '../../../lib/skills/skillGraph'
import { slugToSkillId } from '../../../lib/skills/slug'
import { getGuide, resolveGuide } from '../../../data/skillGuides'
import {
  getExamProfile, dressedFramings, bareClaim, chainClaim, calcClaim,
  sliceProvenance, codedBoards, type Tier,
} from '../../../lib/skills/examProfile'
import { getTier, setTier as persistTier } from '../../../lib/skills/tierPreference'
import { trackEvent, getSessionId } from '../../../lib/analytics'
import { colors, font, radius, primaryButton, secondaryButton, inputStyle } from '../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The skill page — trial of the tier 2 + tier 3 format on a single skill.
//
// Section order is deliberate and follows what a stuck student needs first:
//   recognise -> confusable -> judge some stems -> method -> check
// The derived exam profile sits near the end, just before practice: it is the
// most defensible content on the page but it answers "what should I expect",
// not "what do I do now", so it reads as context rather than an opener.
//
// Nothing links here except the contextual prompt on the question page, so the
// trial stays contained until the format has been reviewed.
// ─────────────────────────────────────────────────────────────────────────────

/** Only AQA has coded papers today. Kept explicit so the gap is visible. */
const DEFAULT_BOARD = 'AQA'

type Rating = 'useful' | 'not_useful'

export default function SkillGuidePage() {
  const router = useRouter()
  const params = useParams()
  const slug = String(params.slug ?? '')

  const skillId = slugToSkillId(slug)
  const skill = skillId ? skillsById[skillId] : null
  const guide = skillId ? getGuide(skillId) : null

  const [tier, setTierState] = useState<Tier>('foundation')
  const [board] = useState<string>(DEFAULT_BOARD)
  const [recent, setRecent] = useState<{ correct: boolean }[] | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  /** Indices of example stems whose verdict has been revealed. */
  const [revealed, setRevealed] = useState<number[]>([])

  const [rating, setRating]       = useState<Rating | null>(null)
  const [comment, setComment]     = useState('')
  const [replyTo, setReplyTo]     = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)

  // Tier comes from the browser, not the server — see lib/skills/tierPreference.
  useEffect(() => { setTierState(getTier()) }, [])

  useEffect(() => {
    if (!skillId || !guide) return
    trackEvent('skill_guide_view', { skill: skillId, tier, board })
  }, [skillId, guide, tier, board])

  // The student's recent attempts on this skill, for the standing strip.
  // Best-effort: signed-out visitors simply don't see it.
  useEffect(() => {
    if (!skillId) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRecent([]); return }
      setStudentId(user.id)
      const { data } = await supabase
        .from('practice_attempts')
        .select('correct, attempted_at')
        .eq('student_id', user.id)
        .contains('skill_ids', [skillId])
        .order('attempted_at', { ascending: false })
        .limit(5)
      setRecent((data ?? []).map(a => ({ correct: Boolean(a.correct) })))
    })()
  }, [skillId])

  function changeTier(next: Tier) {
    setTierState(next)
    persistTier(next)
    setRevealed([])   // the example set changes with the tier
    trackEvent('skill_guide_tier_change', { skill: skillId, tier: next })
  }

  function reveal(index: number) {
    setRevealed(prev => (prev.includes(index) ? prev : [...prev, index]))
    trackEvent('skill_guide_example_reveal', { skill: skillId, tier, index })
  }

  async function sendFeedback() {
    if (sending || (!rating && !comment.trim())) return
    setSending(true)

    if (rating) {
      trackEvent('skill_guide_rating', {
        skill: skillId, tier, board, rating, with_comment: Boolean(comment.trim()),
      })
    }

    // The endpoint requires a message, so a bare rating stays an analytics
    // event and never posts an empty note.
    if (comment.trim()) {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:   comment.trim(),
            category:  rating === 'useful' ? 'praise' : rating === 'not_useful' ? 'idea' : 'other',
            context:   `skill_guide:${skillId}:${tier}`,
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

  // ── Unknown skill, or a skill with no guide written yet ────────────────────
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

  if (!guide) {
    return (
      <main style={styles.page}>
        <p style={styles.kicker}>{skill.topic}</p>
        <h1 style={styles.title}>{skill.name}</h1>
        <p style={styles.muted}>
          There&apos;s no written guide for this skill yet — we&apos;re trialling the format on
          one skill first. You can still practise it.
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

  const g = resolveGuide(guide, tier)
  // Headings name the skill rather than saying "it". Plural rather than
  // "a/an <skill>", so the phrasing stays grammatical for every skill name.
  const lowerName = skill.name.toLowerCase()
  const profile = getExamProfile(skillId, board, tier)
  const showProfile = profile?.sufficient ?? false
  const provenance = sliceProvenance(board, tier)
  const dressed = profile ? dressedFramings(profile) : []
  const dressedTotal = dressed.reduce((s, d) => s + d.count, 0)

  return (
    <main style={styles.page}>

      <button
        onClick={() => router.back()}
        style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, alignSelf: 'flex-start' }}
      >
        ← Back
      </button>

      {/* ── Title and standing ───────────────────────────────────────────── */}
      <section style={styles.card}>
        <p style={styles.kicker}>{skill.topic}</p>
        <h1 style={styles.title}>{skill.name}</h1>
        <p style={{ ...styles.muted, marginBottom: '14px' }}>{g.summary}</p>

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

      {/* ── Tier switch ──────────────────────────────────────────────────── */}
      <section style={styles.card}>
        <p style={styles.h}>Which paper are you sitting?</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['foundation', 'higher'] as Tier[]).map(t => (
            <button
              key={t}
              onClick={() => changeTier(t)}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: radius.md,
                border: `1px solid ${tier === t ? colors.primary : colors.borderStrong}`,
                background: tier === t ? colors.primary : colors.card,
                color: tier === t ? '#ffffff' : colors.textPrimary,
                fontWeight: '600',
                fontSize: font.base,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t === 'foundation' ? 'Foundation' : 'Higher'}
            </button>
          ))}
        </div>
        <p style={{ ...styles.hint, marginTop: '8px' }}>
          This changes what&apos;s shown below and is remembered on this device.
          {codedBoards().length === 1 && ` Exam data is ${codedBoards()[0]} only for now.`}
        </p>
      </section>

      {g.higherNote && (
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

      {/* ── Recognise ──────────────────────────────────────────────────────
          Each cue carries an optional fragment showing the pattern as it
          appears on a paper. A cue on its own describes a pattern in the
          abstract, which is easy to agree with and hard to spot in the exam. */}
      <section style={styles.card}>
        <p style={styles.h}>Recognising {lowerName} questions</p>
        <ul style={{ ...styles.list, gap: '14px' }}>
          {g.recognise.map((r, i) => (
            <li key={i} style={styles.li}>
              {r.text}
              {r.example && <span style={styles.specimen}>{r.example}</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Confusable with ──────────────────────────────────────────────────
          Each line is labelled with the skill it describes, rather than a
          paragraph naming both. The student should never have to work out
          which half of a sentence belongs to which skill. */}
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

                <p style={styles.ask}>
                  <span style={styles.askLabel}>Ask yourself</span>
                  {c.ask}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Judge the stems ──────────────────────────────────────────────── */}
      <section style={styles.card}>
        <p style={styles.h}>Which of these are {skill.name.toLowerCase()} questions?</p>
        <p style={{ ...styles.hint, marginBottom: '12px' }}>
          Decide before you look. Not all of them are — that&apos;s the point.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {g.examples.map((ex, i) => {
            const isOpen = revealed.includes(i)
            const other = ex.actuallySkillId ? skillsById[ex.actuallySkillId] : null
            return (
              <div key={i} style={styles.example}>
                <p style={styles.exampleStem}>{ex.stem}</p>

                {!isOpen ? (
                  <button
                    onClick={() => reveal(i)}
                    style={{ ...secondaryButton, width: 'auto', padding: '7px 14px', fontSize: font.base }}
                  >
                    Show what it is
                  </button>
                ) : (
                  <div style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: '10px',
                    marginTop: '2px',
                  }}>
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Method ───────────────────────────────────────────────────────── */}
      <section style={styles.card}>
        <p style={styles.h}>How to answer {lowerName} questions, and why each step</p>
        {g.steps.map((s, i) => (
          <div key={i} style={{ ...styles.step, borderTop: i === 0 ? 'none' : `1px solid ${colors.border}` }}>
            <div style={styles.stepN}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <p style={styles.stepDo}>{s.do}</p>
              <p style={styles.stepSub}>
                <span style={{ ...styles.lbl, color: colors.primary }}>Why</span>{s.because}
              </p>
              <p style={{ ...styles.stepSub, marginBottom: 0 }}>
                <span style={{ ...styles.lbl, color: colors.warningText }}>Watch</span>{s.watch}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Check ────────────────────────────────────────────────────────── */}
      <section style={{ ...styles.card, background: colors.cardAlt }}>
        <p style={styles.h}>Before you write the answer down</p>
        <ul style={{ ...styles.list, listStyle: 'none', paddingLeft: 0 }}>
          {g.check.map((c, i) => (
            <li key={i} style={{ ...styles.li, display: 'flex', gap: '10px' }}>
              <span style={styles.checkMark}>?</span>
              <span style={{ flex: 1 }}>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Tier 3: derived from the coded papers ────────────────────────── */}
      {showProfile && profile && (
        <section style={{ ...styles.card, background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <p style={styles.h}>How {lowerName} shows up on the exam paper</p>

          <div style={styles.stats}>
            <Stat n={`${profile.papersSeen}`} sub={`/ ${profile.papersTotal}`} label="papers it appeared in" />
            <Stat n={`${profile.marks}`} label="marks in questions using it" />
            <Stat
              n={profile.markRange[0] === profile.markRange[1]
                ? `${profile.markRange[0]}`
                : `${profile.markRange[0]}–${profile.markRange[1]}`}
              label="marks per question"
            />
            <Stat n={`${profile.barePct}`} sub="%" label="asked straight out" />
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

          <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '14px 0 0' }}>
            <strong>{bareClaim(profile, skill.name)}</strong>
            {chainClaim(profile) && ` ${chainClaim(profile)}`}
            {calcClaim(profile) && ` ${calcClaim(profile)}`}
          </p>

          {provenance && (
            <p style={styles.provenance}>
              Derived from {provenance.papers.length} {board} {tier === 'higher' ? 'Higher' : 'Foundation'} papers
              {provenance.series.length ? ` (${provenance.series.join(', ')})` : ''} · {profile.parts} coded parts
            </p>
          )}
        </section>
      )}

      {!showProfile && (
        <section style={{ ...styles.card, background: colors.cardAlt }}>
          <p style={styles.h}>How {lowerName} shows up on the exam paper</p>
          <p style={{ ...styles.muted, margin: 0 }}>
            We haven&apos;t been through enough {board} {tier === 'higher' ? 'Higher' : 'Foundation'} papers
            to tell you anything useful about {lowerName} yet. We&apos;d rather leave this out than guess.
          </p>
        </section>
      )}

      {/* ── Practise ─────────────────────────────────────────────────────── */}
      <section style={styles.card}>
        <p style={styles.h}>Practise {lowerName}</p>
        <button
          onClick={() => {
            trackEvent('skill_guide_practise', { skill: skillId, tier })
            router.push(`/practice?skillId=${skillId}`)
          }}
          style={primaryButton}
        >
          Practise {skill.name.toLowerCase()}
        </button>
      </section>

      {/* ── Trial feedback ───────────────────────────────────────────────── */}
      <section style={{ ...styles.card, borderColor: colors.primary }}>
        {sent ? (
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            ✓ Thanks — that goes straight to the person who wrote this page.
          </p>
        ) : (
          <>
            <p style={{ ...styles.h, marginBottom: '4px' }}>Is this page useful?</p>
            <p style={{ ...styles.hint, marginBottom: '12px' }}>
              This page is new and we&apos;re trying it on one skill first. What you say here
              decides whether we write them for the rest.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {([['useful', 'Yes, useful'], ['not_useful', 'Not really']] as [Rating, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setRating(rating === value ? null : value)}
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

            <label htmlFor="guide-comment" style={{ ...styles.hint, display: 'block', marginBottom: '5px' }}>
              {rating === 'not_useful'
                ? 'What would have helped instead?'
                : 'What was missing, confusing, or worth keeping?'}
            </label>
            <textarea
              id="guide-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Anything at all — even one line is useful."
              style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px', lineHeight: 1.5 }}
            />

            <label htmlFor="guide-reply" style={{ ...styles.hint, display: 'block', marginBottom: '5px' }}>
              Email, if you&apos;d like a reply (optional)
            </label>
            <input
              id="guide-reply"
              type="email"
              value={replyTo}
              onChange={e => setReplyTo(e.target.value)}
              placeholder="you@example.com"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />

            <button
              onClick={sendFeedback}
              disabled={sending || (!rating && !comment.trim())}
              style={{
                ...primaryButton,
                opacity: sending || (!rating && !comment.trim()) ? 0.6 : 1,
                cursor: sending || (!rating && !comment.trim()) ? 'default' : 'pointer',
              }}
            >
              {sending ? 'Sending…' : 'Send feedback'}
            </button>
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
  page: {
    maxWidth: '640px',
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

  step: { display: 'flex', gap: '12px', padding: '14px 0' },
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
}
