'use client'

import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'
import type { DemoQ, Rendered } from '../../lib/demoQuestions'
import type { BankStats } from '../../lib/demoShowcase'
import { colors, font, radius, card as cardStyle } from '../../lib/styles'
import DemoNav from './DemoNav'
import TourQuestion from './TourQuestion'

/** The contact form already used by /for-teachers — one destination, not two. */
const CONTACT_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=header'

// ─── Stop shell ─────────────────────────────────────────────────────────────

/**
 * One numbered stop. `lookFor` is the thing that makes the tour a tour rather
 * than a list of links: someone evaluating software does not know what they are
 * supposed to notice, and the whole product turns on details (a trap response
 * rather than a red cross) that are easy to click straight past.
 */
function Stop({ n, title, minutes, lookFor, children }: {
  n: number
  title: string
  minutes: number
  lookFor: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={{ ...cardStyle, padding: '24px 26px', marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: radius.full, background: colors.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: font.lg, flexShrink: 0,
        }}>{n}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: font['2xl'], fontWeight: '800', color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
              {title}
            </h2>
            <span style={{ fontSize: font.sm, color: colors.textHint, whiteSpace: 'nowrap' }}>
              about {minutes} min
            </span>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fffbeb', border: `1px solid ${colors.warningBorder}`, borderRadius: radius.md,
        padding: '11px 14px', marginBottom: 16,
      }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: colors.warningText, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          What to look for
        </span>
        <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '4px 0 0', lineHeight: 1.6 }}>
          {lookFor}
        </p>
      </div>

      {children}
    </section>
  )
}

function CtaLink({ href, children, event, secondary = false }: {
  href: string
  children: React.ReactNode
  event: string
  secondary?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent(event)}
      style={{
        display: 'inline-block', padding: '12px 22px', borderRadius: radius.md,
        fontSize: font.md, fontWeight: secondary ? '700' : '800', textDecoration: 'none',
        background: secondary ? colors.card : colors.primary,
        color: secondary ? colors.textPrimary : '#fff',
        border: secondary ? `1px solid ${colors.borderStrong}` : 'none',
      }}
    >
      {children}
    </Link>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DemoTour({ demoPool, demoQuestion, stats }: {
  demoPool: DemoQ[]
  demoQuestion: Rendered | null
  stats: BankStats | null
}) {
  return (
    <div style={{ minHeight: '100dvh', background: colors.background }}>
      <DemoNav subtitle="Guided tour" showTourLink={false} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 72px' }}>

        {/* ── Hero ── */}
        <div style={{
          ...cardStyle, padding: '30px 30px 26px', marginBottom: 22,
          background: `linear-gradient(135deg, ${colors.primary}0d, ${colors.primary}03)`,
          borderColor: `${colors.primary}30`,
        }}>
          <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            For teachers &amp; tutors
          </p>
          <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.025em', lineHeight: 1.12 }}>
            See how Mathsense works, in about ten minutes
          </h1>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 18px', lineHeight: 1.7 }}>
            Four stops, in order. Everything here is the real product with real questions —
            no video, no sales call first. Nothing you do on this tour is recorded against a
            student, and you do not need an account for any of it.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['4 stops', 'No account needed', 'Nothing is saved', 'Works on a phone'].map(t => (
              <span key={t} style={{
                fontSize: font.sm, fontWeight: '600', color: colors.textSecondary,
                background: colors.card, border: `1px solid ${colors.border}`,
                borderRadius: radius.full, padding: '5px 12px',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Stop 1 ── */}
        <Stop
          n={1}
          title="Answer a question — and get it wrong on purpose"
          minutes={2}
          lookFor={<>
            Try the mistake a student would actually make: drop a minus sign, forget the last
            step, use the wrong operation. The feedback names <em>that</em> mistake. Wrong
            answers are written at authoring time, one response each, which is the difference
            between marking and teaching.
          </>}
        >
          <TourQuestion initialPool={demoPool} initialQuestion={demoQuestion} />
        </Stop>

        {/* ── Stop 2 ── */}
        <Stop
          n={2}
          title="See the range of questions"
          minutes={3}
          lookFor={<>
            Most online practice is type-a-number only. Look for the diagram questions, the
            multi-part stems with marks per part, the grid you draw a reflection on, and the
            frequency trees you fill in — the parts of a real paper that usually get skipped.
          </>}
        >
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
            {['Diagrams', 'Multi-part with marks', 'Drawing on a grid', 'Frequency trees & Venn diagrams',
              'Expressions & surds', 'Multi-skill synthesis'].map(t => (
              <span key={t} style={{
                fontSize: font.sm, fontWeight: '600', color: colors.primary,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: radius.full, padding: '5px 12px',
              }}>{t}</span>
            ))}
          </div>
          {stats && (
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 16px', lineHeight: 1.65 }}>
              <strong style={{ color: colors.textPrimary }}>{stats.questions}</strong> published questions
              across <strong style={{ color: colors.textPrimary }}>{stats.skills}</strong> GCSE skills,
              carrying <strong style={{ color: colors.textPrimary }}>{stats.traps}</strong> coded wrong
              answers.{' '}
              {/* Reads as a coincidence rather than a claim when the two numbers
                  happen to be equal, so say what it actually means instead. */}
              {stats.explanations >= stats.questions
                ? <>Every one has a worked solution.</>
                : <><strong style={{ color: colors.textPrimary }}>{stats.explanations}</strong> have a worked solution.</>}
            </p>
          )}
          <CtaLink href="/demo/questions" event="tour_stop2_clicked">Open the question showcase →</CtaLink>
        </Stop>

        {/* ── Stop 3 ── */}
        <Stop
          n={3}
          title="Make a set of marks earn its keep"
          minutes={4}
          lookFor={<>
            You have already done the marking — this is what those marks are worth once they are
            typed in. Look at how specific the output is: not a class average, but the exact
            questions they dropped and a different set of retry questions for each student.
          </>}
        >
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 14px', lineHeight: 1.7 }}>
            Load the sample class and press through to the feedback step. Every question is
            tagged to the skill it tests, so a column of numbers becomes:
          </p>
          <ul style={{ fontSize: font.base, color: colors.textPrimary, margin: '0 0 16px', paddingLeft: 20, lineHeight: 1.9 }}>
            <li>the questions most of the class dropped, ranked — where to spend Monday</li>
            <li>per-student &ldquo;what went well / even better if&rdquo;, editable before you send it</li>
            <li>retry questions picked per student from the skills they personally missed</li>
            <li>a class starter sheet built from the common gaps, and a print view</li>
          </ul>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 18px', lineHeight: 1.7 }}>
            That is the win you get the same afternoon. The slower one is stop 4: because marks
            attach to <em>skills</em> rather than to a single paper, they build into a picture of
            the class that a drawer full of spreadsheets never quite gives you.{' '}
            {/* The one-paper limit, as an offer rather than a shortfall. The
                "nothing is saved" caveat lives on the tool itself, where it
                matters operationally — not here. */}
            Set up here for AQA Foundation Paper 3, November 2024; if your class sat a different
            paper, ask and I&apos;ll add it.
          </p>
          <CtaLink href="/demo/marking?demo=1" event="tour_stop3_clicked">Open it with the sample class →</CtaLink>
        </Stop>

        {/* ── Stop 4 ── */}
        <Stop
          n={4}
          title="See what builds up over a term"
          minutes={2}
          lookFor={<>
            Both of these are populated with sample data so you can see a term&apos;s worth at once.
            Look at how a wrong answer travels: a question is tagged to a skill, the skill moves on
            the student&apos;s map, and the class view surfaces the skills where most of the group is
            stuck — so &ldquo;what should I reteach on Monday&rdquo; has an answer.
          </>}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CtaLink href="/demo/dashboard/teacher" event="tour_stop4_teacher_clicked">Teacher dashboard →</CtaLink>
            <CtaLink href="/demo/dashboard/student" event="tour_stop4_student_clicked" secondary>Student dashboard →</CtaLink>
          </div>
        </Stop>

        {/* ── Which half applies to you ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16, marginBottom: 18,
        }}>
          <div style={{ ...cardStyle }}>
            <h3 style={{ fontSize: font.lg, fontWeight: '800', color: colors.textPrimary, margin: '0 0 8px' }}>
              If you teach a class
            </h3>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: 1.7 }}>
              Stops 3 and 4 are the ones that matter. Marking a paper takes the time you already
              spend and returns per-student feedback and a starter sheet from it; the class view then
              accumulates across assessments so the gaps are visible without you tallying anything.
            </p>
          </div>
          <div style={{ ...cardStyle }}>
            <h3 style={{ fontSize: font.lg, fontWeight: '800', color: colors.textPrimary, margin: '0 0 8px' }}>
              If you tutor one to one
            </h3>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: 1.7 }}>
              Stops 1 and 2 matter more. A student can practise between sessions and you see
              exactly which misconception they hit, not just a score — so the next hour starts
              from evidence. Students hold their own accounts; you do not need a class to use it.
            </p>
          </div>
        </div>

        {/* ── Close ── */}
        <div style={{
          ...cardStyle, padding: '28px 30px', textAlign: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', border: 'none',
        }}>
          <h2 style={{ fontSize: 'clamp(21px, 3.5vw, 28px)', fontWeight: '800', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Seen enough to have an opinion?
          </h2>
          <p style={{ fontSize: font.md, color: 'rgba(255,255,255,0.82)', margin: '0 0 24px', lineHeight: 1.65, maxWidth: 520, marginInline: 'auto' }}>
            I am building this with teachers and tutors rather than at them, so critical feedback
            is genuinely more useful than a sign-up. Either is welcome.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                trackEvent('tour_contact_clicked')
                window.open(CONTACT_FORM, '_blank')
              }}
              style={{
                background: '#fff', color: colors.primary, border: 'none', padding: '13px 26px',
                borderRadius: radius.md, fontSize: font.md, fontWeight: '800',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Tell me what you think
            </button>
            <Link
              href="/auth"
              onClick={() => trackEvent('tour_signup_clicked')}
              style={{
                background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', color: '#fff',
                padding: '12px 26px', borderRadius: radius.md, fontSize: font.md,
                fontWeight: '700', textDecoration: 'none',
              }}
            >
              Create a teacher account
            </Link>
          </div>
          <p style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.6)', margin: '18px 0 0', lineHeight: 1.6 }}>
            Students sign up themselves at{' '}
            <Link href="/student" style={{ color: '#fff', fontWeight: 700 }}>mathsense.net/student</Link>
            {' '}· full detail for schools on the{' '}
            <Link href="/for-teachers" style={{ color: '#fff', fontWeight: 700 }}>teachers page</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
