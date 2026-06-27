'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { trackEvent } from '../lib/analytics'
import { supabase } from '../lib/supabase'
import { renderQuestion, type Parameters } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'
import { skillsById } from '../lib/skills/skillGraph'
import { colors, font, radius } from '../lib/styles'

// ── Demo Question — real engine, varied questions from the live bank ──────────

type DemoQ = {
  id: string
  question_template: string
  answer_template: string
  answer_type: 'numeric' | 'fraction' | 'exact'
  tolerance: number | null
  traps: { answer_template: string; response: string }[]
  parameters: Parameters
  explanation: string | null
  requires_simplest: boolean | null
  skill_ids: string[]
}

type Rendered = {
  q: DemoQ
  questionHtml: string
  answer: string
  traps: { answer: string; response: string }[]
  explanationHtml: string
}

function renderOne(q: DemoQ): Rendered {
  const r = renderQuestion(q.question_template, q.answer_template, q.traps ?? [], q.explanation, q.parameters ?? {})
  return { q, questionHtml: r.question, answer: r.answer, traps: r.traps, explanationHtml: r.explanation }
}

const feedbackHtml: React.CSSProperties = { fontSize: font.base, color: colors.textPrimary, margin: '0 0 14px', lineHeight: 1.6 }

function DemoQuestion() {
  const [pool, setPool] = useState<DemoQ[]>([])
  const [cursor, setCursor] = useState(0)
  const [current, setCurrent] = useState<Rendered | null>(null)
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<{ correct: boolean; html: string } | null>(null)
  const [answered, setAnswered] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [skillsSeen, setSkillsSeen] = useState<Set<string>>(new Set())
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [signupModalShown, setSignupModalShown] = useState(false)

  // Pull a curated pool of demo-friendly questions: single-answer, has a trap,
  // numeric/fraction answer (easy to type), no diagram. Each one renders with
  // fresh random parameters via the real engine — exactly like practice.
  useEffect(() => {
    let live = true
    supabase
      .from('questions')
      .select('id, question_template, answer_template, answer_type, tolerance, traps, parameters, explanation, requires_simplest, skill_ids')
      .eq('is_published', true)
      .is('parts', null)
      .in('answer_type', ['numeric', 'fraction'])
      .not('question_template', 'ilike', '%<svg%')
      .lte('difficulty', 3) // keep the front-page demo approachable — no hard Higher-tier questions
      .limit(60)
      .then(({ data }) => {
        if (!live || !data) return
        const clean = (data as DemoQ[]).filter(
          q => Array.isArray(q.traps) && q.traps.length > 0 && !/<table/i.test(q.question_template),
        )
        if (clean.length === 0) return
        clean.sort(() => Math.random() - 0.5)
        setPool(clean)
        setCurrent(renderOne(clean[0]))
      })
    return () => { live = false }
  }, [])

  function check() {
    if (!current || !raw.trim()) return
    const res = checkAnswer(raw, current.answer, current.q.answer_type, current.q.tolerance, current.traps, current.q.requires_simplest ?? false)
    setResult({
      correct: res.correct,
      html: res.correct
        ? (current.explanationHtml || `The answer is <strong>${current.answer}</strong>.`)
        : (res.trap?.response || `Not quite — the correct answer is <strong>${current.answer}</strong>.`),
    })
    setAnswered(a => a + 1)
    if (res.correct) setCorrectCount(c => c + 1)
    const sk = current.q.skill_ids?.[0]
    if (sk) setSkillsSeen(prev => (prev.has(sk) ? prev : new Set(prev).add(sk)))
    // Pop the progress-evidence sign-up box once they've really had a go.
    if (answered + 1 >= 5 && !signupModalShown) {
      setShowSignupModal(true)
      setSignupModalShown(true)
    }
  }

  function next() {
    if (pool.length === 0) return
    const nc = (cursor + 1) % pool.length
    setCursor(nc)
    setCurrent(renderOne(pool[nc]))
    setRaw(''); setResult(null)
  }
  // "Try again" re-rolls the SAME skill with fresh numbers (matches /practice),
  // so it's a genuine second go rather than the identical question.
  function retry() {
    if (!current) return
    setCurrent(renderOne(current.q))
    setRaw(''); setResult(null)
  }

  const skill = current ? skillsById[current.q.skill_ids?.[0]] : null

  return (
    <>
    <div style={{
      background: '#fff',
      border: 'none',
      borderRadius: radius.lg,
      overflow: 'hidden',
      maxWidth: 560,
      margin: '0 auto',
      // Big elevation + bright halo so the card clearly floats above the blue hero.
      boxShadow: '0 34px 70px -12px rgba(0,0,0,0.58), 0 0 0 1px rgba(255,255,255,0.9), 0 0 0 10px rgba(255,255,255,0.14)',
      textAlign: 'left',
    }}>
      {/* Accent cap — a vivid top edge so the card reads as its own object */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${colors.primary}, #60a5fa, ${colors.primary})` }} />
      {/* Card header */}
      <div style={{
        background: `${colors.primary}12`,
        borderBottom: `1px solid ${colors.border}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <span style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const }}>
          Live practice question
        </span>
        <span style={{ fontSize: font.sm, color: colors.textHint, textAlign: 'right' as const }}>
          {skill ? `${skill.topic} · ${skill.name}` : 'GCSE Maths'}
        </span>
      </div>

      <div style={{ padding: '24px 24px 20px' }}>
        {!current ? (
          /* Skeleton while the pool loads */
          <div>
            <div style={{ height: 15, background: colors.cardAlt, borderRadius: 4, margin: '2px 0 10px', width: '88%' }} />
            <div style={{ height: 15, background: colors.cardAlt, borderRadius: 4, margin: '0 0 24px', width: '52%' }} />
            <div style={{ height: 46, background: colors.cardAlt, borderRadius: radius.md }} />
          </div>
        ) : (
          <>
            {/* Question (rendered HTML from the engine) */}
            <div
              style={{ fontSize: font.lg, color: colors.textPrimary, margin: '0 0 22px', lineHeight: '1.65' }}
              dangerouslySetInnerHTML={{ __html: current.questionHtml }}
            />

            {/* Answer input */}
            {!result && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={raw}
                  onChange={e => setRaw(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && check()}
                  placeholder="Type your answer"
                  style={{
                    flex: 1, width: '100%', boxSizing: 'border-box' as const,
                    padding: '11px 14px',
                    border: `1.5px solid ${colors.borderStrong}`, borderRadius: radius.md,
                    fontSize: font.lg, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button
                  onClick={check}
                  style={{
                    background: colors.primary, color: '#fff', border: 'none',
                    borderRadius: radius.md, padding: '0 22px', fontSize: font.lg,
                    fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const,
                    fontFamily: 'inherit', flexShrink: 0,
                  }}
                >
                  Check →
                </button>
              </div>
            )}

            {/* Correct */}
            {result?.correct && (
              <div style={{ background: colors.successLight, border: `1px solid ${colors.successBorder}`, borderRadius: radius.md, padding: '14px 16px' }}>
                <p style={{ fontSize: font.lg, fontWeight: '700', color: colors.successText, margin: '0 0 6px' }}>✓ Correct!</p>
                <div style={feedbackHtml} dangerouslySetInnerHTML={{ __html: result.html }} />
                <button
                  onClick={() => { trackEvent('demo_next_clicked'); next() }}
                  style={{
                    background: colors.primary, color: '#fff', border: 'none',
                    borderRadius: radius.md, padding: '9px 18px', fontSize: font.base,
                    fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Try another →
                </button>
              </div>
            )}

            {/* Wrong / trap */}
            {result && !result.correct && (
              <div style={{ background: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`, borderRadius: radius.md, padding: '14px 16px' }}>
                <p style={{ fontSize: font.lg, fontWeight: '700', color: colors.dangerText, margin: '0 0 6px' }}>✗ Not quite</p>
                <div style={feedbackHtml} dangerouslySetInnerHTML={{ __html: result.html }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  <button
                    onClick={retry}
                    style={{
                      background: 'transparent', color: colors.textPrimary,
                      border: `1.5px solid ${colors.borderStrong}`,
                      borderRadius: radius.md, padding: '8px 16px', fontSize: font.base,
                      fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => { trackEvent('demo_next_clicked'); next() }}
                    style={{
                      background: colors.primary, color: '#fff', border: 'none',
                      borderRadius: radius.md, padding: '8px 16px', fontSize: font.base,
                      fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Next question →
                  </button>
                </div>
              </div>
            )}

            {/* Gentle inline nudge after a couple of answers (the stronger
                progress prompt pops as a modal at 5 — see below). */}
            {answered >= 2 && result && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px dashed ${colors.border}`, textAlign: 'center' as const }}>
                <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 10px', lineHeight: 1.55 }}>
                  👏 You&apos;ve got the hang of it. Keep going — practise all 152 skills with the same instant feedback.
                </p>
                <Link
                  href="/practice"
                  onClick={() => trackEvent('demo_to_practice_clicked')}
                  style={{
                    display: 'inline-block', background: colors.primary, color: '#fff',
                    padding: '11px 22px', borderRadius: radius.md, fontSize: font.base,
                    fontWeight: '700', textDecoration: 'none',
                  }}
                >
                  Start practising free →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* Progress-evidence sign-up box — a pop-up over the page (same window) */}
    {showSignupModal && (
      <div
        onClick={() => setShowSignupModal(false)}
        style={{ position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: radius.lg, maxWidth: 420, width: '100%', padding: '30px 26px 22px', textAlign: 'center' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.32)', position: 'relative' as const }}
        >
          <button onClick={() => setShowSignupModal(false)} aria-label="Close" style={{ position: 'absolute' as const, top: 12, right: 14, background: 'none', border: 'none', fontSize: font.xl, color: colors.textSecondary, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          <div style={{ fontSize: 38, marginBottom: 6 }}>📈</div>
          <h3 style={{ fontSize: font.xl, fontWeight: '800', color: colors.textPrimary, margin: '0 0 8px' }}>You&apos;re making progress!</h3>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
            <strong style={{ color: colors.textPrimary }}>{correctCount}/{answered}</strong> correct across{' '}
            <strong style={{ color: colors.textPrimary }}>{skillsSeen.size}</strong> skill{skillsSeen.size === 1 ? '' : 's'} so far.
            Create a free account to save your progress and build your full skill map across all 135 GCSE Maths skills.
          </p>
          <Link
            href="/student"
            onClick={() => trackEvent('demo_signup_prompt_clicked')}
            style={{ display: 'block', background: colors.primary, color: '#fff', padding: '13px', borderRadius: radius.md, fontSize: font.lg, fontWeight: '800', textDecoration: 'none', marginBottom: 10 }}
          >
            Create a free account →
          </Link>
          <button onClick={() => setShowSignupModal(false)} style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: font.sm, cursor: 'pointer', fontWeight: '600' }}>
            Keep practising
          </button>
        </div>
      </div>
    )}
    </>
  )
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8fafc' }}>

      {/* ── Navigation ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${colors.border}`,
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: font.xl, fontWeight: '800', color: colors.primary, letterSpacing: '-0.02em' }}>
          Mathsense
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/for-teachers" style={{ fontSize: font.sm, color: colors.textSecondary, textDecoration: 'none', fontWeight: '500', padding: '8px 12px' }}>
            For teachers
          </Link>
          <Link href="/student" style={{ fontSize: font.sm, color: colors.textSecondary, textDecoration: 'none', fontWeight: '500', padding: '8px 12px' }}>
            Log in
          </Link>
          <Link
            href="/practice"
            onClick={() => trackEvent('nav_practice_clicked')}
            style={{
              background: colors.primary,
              color: '#fff',
              borderRadius: radius.md,
              padding: '8px 16px',
              fontSize: font.sm,
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Start practising free
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 65%, #3b82f6 100%)',
        padding: 'clamp(56px, 10vw, 96px) 24px',
        textAlign: 'center' as const,
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: radius.full,
            padding: '5px 16px',
            fontSize: font.sm,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '600',
            marginBottom: '28px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>
            GCSE Maths Revision
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 64px)',
            fontWeight: '800',
            color: '#ffffff',
            margin: '0 0 20px',
            lineHeight: '1.08',
            letterSpacing: '-0.03em',
          }}>
            The smarter way to<br />revise GCSE Maths.
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'rgba(255,255,255,0.85)',
            margin: '0 0 28px',
            lineHeight: '1.65',
            maxWidth: '560px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            When you slip on a common mistake, it tells you exactly what went wrong — not just &ldquo;wrong, try again.&rdquo; <strong style={{ color: '#fff' }}>Try one now</strong> — no sign-up needed.
          </p>

          {/* Live, interactive demo — leads with doing, not reading */}
          <div style={{ marginBottom: '28px' }}>
            <DemoQuestion />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: '28px' }}>
            <Link
              href="/practice"
              onClick={() => trackEvent('hero_practice_clicked')}
              style={{
                background: '#ffffff',
                color: colors.primary,
                padding: '15px 30px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-block',
                boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
                letterSpacing: '-0.01em',
              }}
            >
              Start practising free →
            </Link>
            <Link
              href="/student"
              onClick={() => trackEvent('hero_login_clicked')}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.55)',
                padding: '15px 30px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Log in
            </Link>
          </div>

          {/* Diagnostic demoted to a quiet secondary option */}
          <p style={{ margin: '0 0 24px' }}>
            <Link
              href="/student/diagnostic"
              onClick={() => trackEvent('hero_diagnostic_clicked')}
              style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.7)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Or take the 5-minute skill check →
            </Link>
          </p>

          <p style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.02em' }}>
            Free to start &nbsp;·&nbsp; No card required &nbsp;·&nbsp; 5-minute setup
          </p>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderBottom: `1px solid ${colors.border}`, padding: '28px 24px' }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(24px, 6vw, 64px)',
          flexWrap: 'wrap' as const,
        }}>
          {[
            { number: '152', label: 'GCSE Maths skills' },
            { number: '5–10', label: 'minute sessions' },
            { number: '100%', label: 'free to start' },
          ].map(({ number, label }) => (
            <div key={label} style={{ textAlign: 'center' as const }}>
              <p style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '800', color: colors.primary, margin: '0 0 2px', letterSpacing: '-0.03em' }}>{number}</p>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, fontWeight: '500' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            textAlign: 'center' as const,
            color: colors.textPrimary,
            margin: '0 0 48px',
            letterSpacing: '-0.02em',
          }}>
            Everything you need to revise smarter
          </h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
            {[
              {
                emoji: '🧠',
                title: 'Feedback that spots your mistake',
                body: 'Every question knows the common errors and tells you exactly where you went wrong — so you actually learn, not just score.',
              },
              {
                emoji: '🎯',
                title: 'Targeted practice',
                body: "Questions matched to your level, so you always work on the right thing. No time wasted on skills you've already mastered.",
              },
              {
                emoji: '📈',
                title: 'Track your mastery',
                body: "Watch 152 skills move from 'not started' to 'mastered'. See your progress build question by question, session by session.",
              },
            ].map(({ emoji, title, body }) => (
              <div key={title} style={{
                flex: '1 1 260px',
                background: '#ffffff',
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                padding: '28px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{emoji}</div>
                <h3 style={{ fontSize: font.lg, fontWeight: '700', color: colors.textPrimary, margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.65' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            textAlign: 'center' as const,
            color: colors.textPrimary,
            margin: '0 0 48px',
            letterSpacing: '-0.02em',
          }}>
            From gaps to gains — in minutes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' as const }}>
            {[
              {
                n: '1',
                title: 'Try real questions — free',
                body: 'Jump straight into GCSE Maths questions with instant feedback. No sign-up needed to start.',
              },
              {
                n: '2',
                title: 'Learn from every mistake',
                body: 'Each question pinpoints the exact error and explains the method — so the next one sticks.',
              },
              {
                n: '3',
                title: 'Create a free account to keep going',
                body: 'Save your progress and get questions targeted at your weak skills. Watch 152 skills go from \'not started\' to \'mastered\'.',
              },
            ].map(({ n, title, body }, i) => (
              <div key={n} style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: colors.primary, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: font.lg, flexShrink: 0,
                  }}>
                    {n}
                  </div>
                  {i < 2 && <div style={{ width: 2, flex: 1, background: colors.border, minHeight: '32px', marginTop: '6px' }} />}
                </div>
                <div style={{ paddingBottom: i < 2 ? '32px' : 0, paddingTop: '8px' }}>
                  <h3 style={{ fontSize: font.lg, fontWeight: '700', color: colors.textPrimary, margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.65' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' as const, marginTop: '48px' }}>
            <Link
              href="/practice"
              onClick={() => trackEvent('howitworks_practice_clicked')}
              style={{
                background: colors.primary,
                color: '#fff',
                padding: '15px 32px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-block',
                letterSpacing: '-0.01em',
              }}
            >
              Start practising free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── For teachers ───────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 7vw, 72px) 24px',
        background: '#eff6ff',
        borderTop: `1px solid #dbeafe`,
        borderBottom: `1px solid #dbeafe`,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' as const }}>
          <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            For teachers
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Using Mathsense with a class?
          </h2>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 28px', lineHeight: '1.65' }}>
            Track which skills each student has mastered, spot gaps across the group, and focus your teaching where it matters most.
          </p>
          <Link
            href="/for-teachers"
            onClick={() => trackEvent('teacher_cta_clicked')}
            style={{
              display: 'inline-block',
              border: `2px solid ${colors.primary}`,
              color: colors.primary,
              padding: '12px 24px',
              borderRadius: radius.md,
              fontSize: font.base,
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Find out more for teachers →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0f172a', padding: '40px 24px' }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '20px',
        }}>
          <span style={{ fontSize: font.xl, fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>Mathsense</span>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            {[
              { label: 'Free diagnostic', href: '/student/diagnostic' },
              { label: 'Student login', href: '/student' },
              { label: 'For teachers', href: '/for-teachers' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm, fontWeight: '500' }}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            © 2026 Mathsense. Built to help students succeed.
          </p>
        </div>
      </footer>

    </div>
  )
}
