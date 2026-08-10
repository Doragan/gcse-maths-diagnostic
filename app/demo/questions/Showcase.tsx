'use client'

import Link from 'next/link'
import { trackEvent } from '../../../lib/analytics'
import { colors, font, radius, card as cardStyle } from '../../../lib/styles'
import { CALCULATOR_LABELS, type CalculatorMode } from '../../../lib/questions/calculator'
import { ANSWER_TYPE_LABELS, type PartAnswerType } from '../../../lib/questions/answerTypes'
import { topicColourFor } from '../../../lib/demoTopicColours'
import {
  SHOWCASE_GROUPS,
  type ShowcaseQ, type ShowcaseGroupId, type BankStats, type Probe,
} from '../../../lib/demoShowcase'
import DemoNav from '../DemoNav'

// ─── Small pieces ───────────────────────────────────────────────────────────

function Badge({ children, tone = 'grey', colour }: {
  children: React.ReactNode
  tone?: 'grey' | 'purple'
  /** Explicit colours — used for the topic chip, so it matches the dashboards. */
  colour?: { fg: string; bg: string; border: string }
}) {
  const tones = colour ?? {
    grey:   { bg: colors.cardAlt, fg: colors.textSecondary, border: colors.border },
    purple: { bg: '#f5f3ff', fg: '#7c3aed', border: '#ddd6fe' },
  }[tone]
  return (
    <span style={{
      fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: radius.full,
      background: tones.bg, color: tones.fg, border: `1px solid ${tones.border}`,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

/**
 * The rendered question itself, on a "paper" panel.
 *
 * The HTML comes from our own param engine rendering our own authored
 * templates — the same string /practice renders — so this is not third-party
 * markup being trusted.
 */
function QuestionBody({ q }: { q: ShowcaseQ }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radius.md,
      padding: '16px 18px', fontSize: font.md, lineHeight: 1.7, color: colors.textPrimary,
      overflowX: 'auto',
    }}>
      {q.stemHtml.trim() !== '' && (
        <div dangerouslySetInnerHTML={{ __html: q.stemHtml }} />
      )}
      {q.parts.map((p, i) => (
        <div key={i} style={{
          marginTop: i === 0 && q.stemHtml.trim() === '' ? 0 : 14,
          paddingTop: 14, borderTop: `1px dashed ${colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: font.sm, fontWeight: '800', color: colors.primary, letterSpacing: '0.04em' }}>
              {p.label.toUpperCase()}
            </span>
            <span style={{ fontSize: font.sm, color: colors.textHint, whiteSpace: 'nowrap' }}>
              {p.marks} mark{p.marks === 1 ? '' : 's'}
              {p.answerType !== 'numeric' && ` · ${ANSWER_TYPE_LABELS[p.answerType as PartAnswerType]?.split(' —')[0] ?? p.answerType}`}
            </span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: p.promptHtml }} />
          {p.gridSvg && (
            <div
              style={{ marginTop: 10, maxWidth: 360 }}
              dangerouslySetInnerHTML={{ __html: p.gridSvg }}
            />
          )}
          {p.blankLabels && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {p.blankLabels.map(l => (
                <span key={l} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: `1.5px dashed ${colors.borderStrong}`, borderRadius: radius.sm,
                  padding: '5px 10px', fontSize: font.sm, color: colors.textSecondary,
                }}>
                  <strong style={{ color: colors.textPrimary }}>{l}</strong> ▢
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * What the grader does with other ways of writing the same answer.
 *
 * These verdicts are not copy — each row was produced by running the live
 * `checkAnswer` against this question's canonical answer when the page was
 * generated, and the grey text is the grader's own message. It is here because
 * equivalence handling is invisible otherwise: it belongs to the answer type,
 * not to the question, so no amount of looking at a question reveals it.
 */
function ProbeStrip({ probes }: { probes: Probe[] }) {
  return (
    <div style={{
      border: `1px solid ${colors.border}`, borderRadius: radius.md,
      background: '#fff', padding: '12px 14px',
    }}>
      <div style={{
        fontSize: '11px', fontWeight: '800', color: colors.textSecondary,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>
        If a student writes it differently
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {probes.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{
              fontSize: font.base, fontWeight: '800', lineHeight: 1.5, flexShrink: 0,
              color: p.accepted ? colors.successText : colors.dangerText,
            }}>
              {p.accepted ? '✓' : '✗'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.5 }}>
                <code style={{
                  background: colors.cardAlt, border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm, padding: '1px 5px', fontSize: font.base,
                }}>{p.input}</code>
                <span style={{ color: colors.textSecondary }}> — {p.label}</span>
              </div>
              <div style={{ fontSize: font.sm, color: colors.textHint, lineHeight: 1.5, marginTop: 2 }}>
                {p.note}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestionCard({ q }: { q: ShowcaseQ }) {
  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12, background: colors.cardAlt }}>

      {/* Metadata */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge colour={topicColourFor(q.topic)}>{q.topic}</Badge>
        <span style={{ fontSize: font.sm, fontWeight: '600', color: colors.textPrimary }}>
          {q.skillNames.join(' + ')}
        </span>
        <span style={{ fontSize: font.sm, color: colors.textHint, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {q.kind === 'exam' && <Badge tone="purple">Synthesis · positive-only</Badge>}
        {q.marks != null && <Badge>{q.marks} marks</Badge>}
        {q.trapCount > 0 && <Badge>{q.trapCount} coded wrong answer{q.trapCount === 1 ? '' : 's'}</Badge>}
        {q.hasExplanation && <Badge>Worked solution</Badge>}
        {q.calculator && q.calculator !== 'na' && (
          <Badge>{CALCULATOR_LABELS[q.calculator as CalculatorMode]?.split(' (')[0] ?? q.calculator}</Badge>
        )}
      </div>

      {/* Why this one is here */}
      <p style={{
        fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: 1.6,
        borderLeft: `3px solid ${colors.primary}`, paddingLeft: 10,
      }}>
        {q.note}
      </p>

      <QuestionBody q={q} />

      {q.probes.length > 0 && <ProbeStrip probes={q.probes} />}

      <Link
        href={`/practice/question/${q.id}`}
        onClick={() => trackEvent('showcase_try_clicked', { question_id: q.id, group: q.group })}
        style={{
          alignSelf: 'flex-start', fontSize: font.base, fontWeight: '700',
          color: colors.primary, textDecoration: 'none',
        }}
      >
        Try it live →
      </Link>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Showcase({ questions, stats }: {
  questions: ShowcaseQ[]
  stats: BankStats | null
}) {
  const byGroup = (id: ShowcaseGroupId) => questions.filter(q => q.group === id)
  const groups = SHOWCASE_GROUPS.filter(g => byGroup(g.id).length > 0)

  return (
    <div style={{ minHeight: '100dvh', background: colors.background }}>
      <DemoNav subtitle="Question showcase" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 72px' }}>

        {/* ── Hero ── */}
        <div style={{ ...cardStyle, padding: '28px 30px', marginBottom: 22 }}>
          <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Stop 2 of 4
          </p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            What the questions can actually ask
          </h1>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 720 }}>
            These are real published questions, rendered live from the bank with freshly generated
            numbers — not screenshots. Every one is playable: press <strong>Try it live</strong> on any
            card to answer it and see the marking.
          </p>

          {stats && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { v: stats.questions, l: 'published questions' },
                { v: stats.skills, l: 'GCSE skills covered' },
                { v: stats.traps, l: 'coded wrong answers' },
                { v: stats.explanations, l: 'with worked solutions' },
                { v: stats.diagrams, l: 'with diagrams' },
                { v: stats.multipart, l: 'multi-part' },
                { v: stats.synthesis, l: 'multi-skill synthesis' },
              ].map(s => (
                <div key={s.l} style={{
                  padding: '10px 16px', borderRadius: radius.md,
                  border: `1px solid ${colors.border}`, background: colors.cardAlt, minWidth: 108,
                }}>
                  <div style={{ fontSize: font['2xl'], fontWeight: '800', color: colors.primary, lineHeight: 1.1 }}>{s.v}</div>
                  <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Jump links ── */}
        {groups.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
            {groups.map(g => (
              <a
                key={g.id}
                href={`#${g.id}`}
                style={{
                  fontSize: font.base, fontWeight: '600', textDecoration: 'none',
                  color: colors.textPrimary, background: colors.card,
                  border: `1px solid ${colors.borderStrong}`, borderRadius: radius.full,
                  padding: '7px 14px',
                }}
              >
                {g.title}
              </a>
            ))}
          </div>
        )}

        {/* ── Groups ── */}
        {groups.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 16px' }}>
              The showcase could not load its questions just now.
            </p>
            <Link href="/practice" style={{ fontSize: font.md, fontWeight: '700', color: colors.primary }}>
              Try the live practice instead →
            </Link>
          </div>
        ) : groups.map(g => (
          <section key={g.id} id={g.id} style={{ marginBottom: 40, scrollMarginTop: 20 }}>
            <h2 style={{ fontSize: font['2xl'], fontWeight: '800', color: colors.textPrimary, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              {g.title}
            </h2>
            <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 16px', lineHeight: 1.7, maxWidth: 760 }}>
              {g.blurb}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 16 }}>
              {byGroup(g.id).map(q => <QuestionCard key={q.id} q={q} />)}
            </div>
          </section>
        ))}

        {/* ── Next stop ── */}
        <div style={{
          ...cardStyle, padding: '26px 28px', textAlign: 'center',
          background: `linear-gradient(135deg, ${colors.primary}0d, ${colors.primary}03)`,
          borderColor: `${colors.primary}30`,
        }}>
          <h2 style={{ fontSize: font['2xl'], fontWeight: '800', color: colors.textPrimary, margin: '0 0 8px' }}>
            Next: make a set of marks earn its keep
          </h2>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 18px', lineHeight: 1.65, maxWidth: 560, marginInline: 'auto' }}>
            You mark the paper; this turns the marks into the next lesson — the questions the class
            dropped, per-student feedback, and a starter sheet. Free, no account.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/demo/marking?demo=1"
              onClick={() => trackEvent('showcase_next_stop_clicked', { to: 'marking' })}
              style={{
                background: colors.primary, color: '#fff', padding: '12px 24px',
                borderRadius: radius.md, fontSize: font.md, fontWeight: '800', textDecoration: 'none',
              }}
            >
              Open the marking tool →
            </Link>
            <Link
              href="/demo"
              onClick={() => trackEvent('showcase_back_to_tour_clicked')}
              style={{
                background: colors.card, color: colors.textPrimary, padding: '12px 24px',
                borderRadius: radius.md, fontSize: font.md, fontWeight: '700', textDecoration: 'none',
                border: `1px solid ${colors.borderStrong}`,
              }}
            >
              Back to the tour
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
