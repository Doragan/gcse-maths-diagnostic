'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import GridCanvas from '../../../../components/practice/GridCanvas'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { slugToSkillId, skillPath } from '../../../../lib/skills/slug'
import { getInvestigation } from '../../../../data/investigations'
import {
  resolveInvestigation, predictionCorrect, concludeGate, rejectValue, addValue,
  sentenceState,
} from '../../../../lib/skills/investigation'
import type { Stage, ResolvedInvestigation } from '../../../../data/investigations/types'
import type { GridPoint } from '../../../../lib/questions/gridDraw'
import { trackEvent } from '../../../../lib/analytics'
import { colors, font, radius, primaryButton, secondaryButton } from '../../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// An investigation — the concept layer (docs/audit/31).
//
// Predict, change one thing, watch the table fill, state the rule, meet the
// word for it. Every action is constrained enough to mark, and the page writes
// no mastery: the only row that reaches practice_attempts is the transfer
// question at the end, answered through the ordinary practice loop.
//
// Reachable from /skills and from the prompt after a wrong answer, and it
// works signed out, like the briefing it sits beneath.
// ─────────────────────────────────────────────────────────────────────────────

type StageState = {
  placed: GridPoint[]
  picked: number | null
  predicted: boolean
  predictRight: boolean
  drawn: number[]
  current: number
  entryError: string
  typed: string
  slots: Record<number, number>
  done: boolean
}

const blankStage = (): StageState => ({
  placed: [],
  picked: null,
  predicted: false,
  predictRight: false,
  drawn: [],
  current: 0,
  entryError: '',
  typed: '',
  slots: {},
  done: false,
})

export default function InvestigatePage() {
  const router = useRouter()
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const skillId = slugToSkillId(slug)
  const skill = skillId ? skillsById[skillId] : null
  const investigation = skillId ? getInvestigation(skillId) : null

  /**
   * Drawn AFTER MOUNT, not during render.
   *
   * The draw calls Math.random, so doing it in render gives the server one set
   * of numbers and the client another — React then throws a hydration mismatch
   * and rebuilds the tree, and for one frame the student sees a different
   * question from the one they end up answering. Resolving in an effect makes
   * the server HTML parameter-free and the draw happen exactly once, on the
   * client, which is also where the rest of this journey already lives.
   */
  const [resolved, setResolved] = useState<ResolvedInvestigation | null>(null)
  const [states, setStates] = useState<StageState[]>([])

  useEffect(() => {
    if (!investigation) return
    const r = resolveInvestigation(investigation)
    setResolved(r)
    setStates(r.stages.map(blankStage))
    trackEvent('investigation_start', { skill: r.skillId, stages: r.stages.length })
    // Keyed on the skill, so a different investigation re-draws and the same
    // one never re-rolls under a student mid-way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigation?.skillId])

  if (skill && investigation && !resolved) {
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <p style={styles.eyebrow}>Investigation · {skill.topic}</p>
          <h1 style={styles.title}>{investigation.title}</h1>
          <p style={styles.lede}>Setting up your version…</p>
        </div>
      </main>
    )
  }

  if (!skill || !investigation || !resolved) {
    return (
      <main style={styles.page}>
        <div style={styles.wrap}>
          <p style={styles.h}>No investigation here yet</p>
          <p style={styles.lede}>
            This skill has no investigation written for it.
          </p>
          <button style={{ ...secondaryButton, width: 'auto' }} onClick={() => router.push('/skills')}>
            All skills
          </button>
        </div>
      </main>
    )
  }

  const update =(i: number, patch: Partial<StageState>) =>
    setStates(prev => prev.map((s, k) => (k === i ? { ...s, ...patch } : s)))

  // ── the student's moves ────────────────────────────────────────────────
  function checkGridPrediction(i: number, stage: Stage) {
    const st = states[i]
    if (st.predicted || st.placed.length === 0) return
    const right = predictionCorrect(stage, st.placed)
    update(i, { predicted: true, predictRight: right })
    trackEvent('investigation_predict', {
      skill: resolved!.skillId, stage: i + 1, kind: 'grid', correct: right,
    })
  }

  function checkChoicePrediction(i: number, stage: Stage) {
    const st = states[i]
    if (st.predicted || st.picked === null) return
    const on = stage.predict.on
    const right = on.kind === 'choice' && st.picked === on.correct
    update(i, { predicted: true, predictRight: right })
    trackEvent('investigation_predict', {
      skill: resolved!.skillId, stage: i + 1, kind: 'choice', correct: right,
    })
  }

  function draw(i: number, stage: Stage, raw: string) {
    const why = rejectValue(stage, raw)
    if (why) { update(i, { entryError: why }); return }
    const v = Number(raw.trim())
    const st = states[i]
    const next = addValue(st.drawn, v)
    const isNew = next.drawn.length > st.drawn.length
    update(i, { ...next, entryError: '', typed: '' })
    if (isNew) {
      trackEvent('investigation_draw', {
        skill: resolved!.skillId, stage: i + 1, control: stage.control?.name, value: v,
        nth: next.drawn.length,
      })
    }
  }

  function pickSlot(i: number, stage: Stage, slot: number, option: number) {
    const st = states[i]
    if (st.done) return
    const slots = { ...st.slots, [slot]: option }
    const state = sentenceState(stage, slots)
    update(i, { slots, done: state.correct })
    trackEvent('investigation_conclude', {
      skill: resolved!.skillId,
      stage: i + 1,
      slot,
      correct: option === stage.conclude.slots[slot].correct,
      misconception: stage.conclude.slots[slot].misconception[option] || null,
    })
  }

  const allDone = states.length > 0 && states[states.length - 1].done

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <button
          style={{ ...secondaryButton, width: 'auto', alignSelf: 'flex-start' }}
          onClick={() => router.push(skillPath(resolved.skillId))}
        >
          ← Briefing
        </button>

        <header>
          <p style={styles.eyebrow}>Investigation · {skill.topic}</p>
          <h1 style={styles.title}>{resolved.title}</h1>
          <p style={styles.lede}>{investigation.premise}</p>
        </header>

        {resolved.stages.map((stage, i) => {
          const st = states[i]
          const locked = i > 0 && !states[i - 1].done
          return (
            <section key={i} style={{ ...styles.card, opacity: locked ? 0.5 : 1 }}>
              <p style={styles.stageN}>Stage {i + 1}</p>
              <p style={styles.ask}>{stage.ask}</p>

              {locked ? (
                <p style={styles.hint}>
                  Opens once you have stated the rule in stage {i}.
                </p>
              ) : (
                <>
                  {/* 1 · predict */}
                  <p style={styles.phase}>1 · Predict</p>
                  <p style={styles.prompt}>{stage.predict.prompt}</p>

                  {!st.predicted && stage.predict.on.kind === 'grid' && (
                    <>
                      <GridCanvas
                        grid={stage.predict.on.grid}
                        value={st.placed}
                        onChange={pts => update(i, { placed: pts })}
                      />
                      <div style={styles.row}>
                        <button
                          style={{ ...primaryButton, width: 'auto' }}
                          disabled={st.placed.length === 0}
                          onClick={() => checkGridPrediction(i, stage)}
                        >
                          Check my prediction
                        </button>
                      </div>
                    </>
                  )}

                  {stage.predict.on.kind === 'choice' && (
                    <>
                      {stage.figure && (
                        // A stage that reads a line off the graph needs the
                        // graph on screen before its options mean anything.
                        <GridCanvas grid={stage.figure} value={[]} readOnly />
                      )}
                      <div style={styles.choices}>
                        {stage.predict.on.options.map((opt, k) => (
                          <button
                            key={k}
                            style={{
                              ...styles.choice,
                              borderColor: st.picked === k ? colors.primary : colors.border,
                              background: st.picked === k ? colors.cardAlt : colors.card,
                            }}
                            disabled={st.predicted}
                            onClick={() => update(i, { picked: k })}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {!st.predicted && (
                        <div style={styles.row}>
                          <button
                            style={{ ...primaryButton, width: 'auto' }}
                            disabled={st.picked === null}
                            onClick={() => checkChoicePrediction(i, stage)}
                          >
                            Lock it in
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {st.predicted && (
                    <p style={{
                      ...styles.verdict,
                      color: st.predictRight ? colors.successText : colors.primaryHover,
                      background: st.predictRight ? colors.successLight : colors.cardAlt,
                      borderColor: st.predictRight ? colors.successBorder : colors.border,
                    }}>
                      <strong>{st.predictRight ? 'Yes. ' : 'Not quite. '}</strong>
                      {st.predictRight ? stage.predict.right : stage.predict.wrong}
                    </p>
                  )}

                  {/* 2 · change it */}
                  {st.predicted && stage.control && (
                    <>
                      <p style={styles.phase}>2 · Draw your own</p>
                      <p style={styles.prompt}>{stage.control.prompt}</p>
                      <div style={styles.row}>
                        <label htmlFor={`v-${i}`} style={styles.varLabel}>
                          {stage.control.name} =
                        </label>
                        <input
                          id={`v-${i}`}
                          type="number"
                          inputMode="decimal"
                          value={st.typed}
                          min={stage.control.domain.min}
                          max={stage.control.domain.max}
                          step={stage.control.domain.step}
                          onChange={e => update(i, { typed: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); draw(i, stage, st.typed) }
                          }}
                          style={styles.numberInput}
                        />
                        <button
                          style={{ ...primaryButton, width: 'auto' }}
                          onClick={() => draw(i, stage, st.typed)}
                        >
                          Draw it
                        </button>
                      </div>
                      <p style={styles.hint}>{stage.control.hint}</p>
                      {st.entryError && <p style={styles.error}>{st.entryError}</p>}

                      {st.drawn.length === 0 && stage.control.suggest && (
                        <div style={styles.chips}>
                          <span style={styles.chipLabel}>stuck? try</span>
                          {stage.control.suggest.map(v => (
                            <button
                              key={v}
                              style={styles.chip}
                              onClick={() => draw(i, stage, String(v))}
                            >
                              {stage.control!.name} = {String(v).replace('-', '−')}
                            </button>
                          ))}
                        </div>
                      )}

                      {st.drawn.length > 0 && (
                        <div style={styles.chips}>
                          <span style={styles.chipLabel}>you have drawn</span>
                          {st.drawn.map((v, k) => (
                            <button
                              key={v}
                              style={{
                                ...styles.chip,
                                borderColor: k === st.current ? colors.primary : colors.border,
                                color: k === st.current ? colors.primary : colors.textSecondary,
                              }}
                              onClick={() => update(i, { current: k })}
                            >
                              {stage.control!.label(v)}
                            </button>
                          ))}
                        </div>
                      )}

                      <GridCanvas
                        grid={stage.control.render(st.drawn, st.current)}
                        value={[]}
                        readOnly
                      />

                      {stage.observe && (
                        <div style={styles.tableWrap}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                {stage.observe.headers.map(h => (
                                  <th key={h} style={styles.th}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {st.drawn.length === 0 ? (
                                <tr>
                                  <td style={styles.tdEmpty} colSpan={stage.observe.headers.length}>
                                    Nothing yet — type a value above and draw it.
                                  </td>
                                </tr>
                              ) : st.drawn.map(v => (
                                <tr key={v}>
                                  {stage.control!.row(v).map((cell, c) => (
                                    <td key={c} style={styles.td}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {/* 3 · conclude */}
                  {st.predicted && (() => {
                    const gate = concludeGate(stage, st.drawn)
                    if (gate) return <p style={styles.hint}>{gate}</p>
                    const state = sentenceState(stage, st.slots)
                    return (
                      <>
                        <p style={styles.phase}>3 · So what is the rule?</p>
                        <p style={styles.sentence}>
                          {stage.conclude.sentence.map((chunk, k) => (
                            <span key={k}>
                              {chunk}
                              {k < stage.conclude.slots.length && (
                                <select
                                  value={st.slots[k] ?? ''}
                                  disabled={st.done}
                                  onChange={e => pickSlot(i, stage, k, Number(e.target.value))}
                                  style={{
                                    ...styles.select,
                                    borderColor: st.slots[k] === undefined
                                      ? colors.primary
                                      : st.slots[k] === stage.conclude.slots[k].correct
                                        ? colors.successBorder
                                        : colors.warningBorder,
                                  }}
                                >
                                  <option value="">choose…</option>
                                  {stage.conclude.slots[k].options.map((opt, o) => (
                                    <option key={o} value={o}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </span>
                          ))}
                        </p>

                        {state.firstWrong > -1 && (
                          <p style={{
                            ...styles.verdict,
                            color: colors.warningText,
                            background: colors.warningLight,
                            borderColor: colors.warningBorder,
                          }}>
                            <strong>Look again. </strong>
                            {stage.conclude.slots[state.firstWrong]
                              .diagnosis[st.slots[state.firstWrong]]}
                          </p>
                        )}

                        {st.done && (
                          <>
                            <p style={{
                              ...styles.verdict,
                              color: colors.successText,
                              background: colors.successLight,
                              borderColor: colors.successBorder,
                            }}>
                              <strong>That is it. </strong>{stage.conclude.because}
                            </p>

                            {stage.naming && (
                              <div style={styles.naming}>
                                <p style={styles.namingLabel}>The word for it</p>
                                <p style={styles.namingTerm}>{stage.naming.term}</p>
                                <p style={styles.namingMeans}>{stage.naming.means}</p>
                                <p style={styles.namingElse}>{stage.naming.elsewhere}</p>
                                <p style={styles.namingPaper}>
                                  <span style={styles.namingPaperLabel}>On the paper</span>
                                  {stage.naming.onThePaper}
                                </p>
                              </div>
                            )}

                            {stage.aside && (
                              <div style={styles.aside}>
                                <p style={styles.asideHead}>{stage.aside.head}</p>
                                <p style={styles.asideBody}>{stage.aside.body}</p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </section>
          )
        })}

        {allDone && (
          <section style={{ ...styles.card, borderColor: colors.primary }}>
            <p style={styles.h}>Now try it on real questions</p>
            <p style={styles.prompt}>
              Nothing above this point counted towards your progress. These do — they are
              marked the same way every other question is.
            </p>
            <div style={styles.row}>
              <button
                style={{ ...primaryButton, width: 'auto' }}
                onClick={() => {
                  trackEvent('investigation_transfer', {
                    skill: resolved.skillId,
                    questions: resolved.transferQuestionIds.length,
                  })
                  // An authored list where one exists; practice on the skill
                  // otherwise, which is the honest fallback rather than a dead
                  // button (docs/audit/31 §6).
                  router.push(resolved.transferQuestionIds.length
                    ? `/practice/question/${resolved.transferQuestionIds[0]}`
                    : '/practice')
                }}
              >
                Try some questions
              </button>
              <button
                style={{ ...secondaryButton, width: 'auto' }}
                onClick={() => router.push(skillPath(resolved.skillId))}
              >
                Read the briefing
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: colors.background, padding: '24px 16px 64px' },
  wrap: { maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' },
  eyebrow: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.09em', textTransform: 'uppercase',
    color: colors.textHint, margin: 0,
  },
  title: { fontSize: font.xl, fontWeight: '750', margin: '6px 0 0', color: colors.textPrimary },
  lede: { fontSize: font.base, color: colors.textSecondary, margin: '8px 0 0', maxWidth: '36em' },
  card: {
    background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radius.lg,
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
  },
  h: { fontSize: font.lg, fontWeight: '700', margin: 0, color: colors.textPrimary },
  stageN: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.07em', textTransform: 'uppercase',
    color: colors.textHint, margin: 0,
  },
  ask: { fontSize: font.lg, fontWeight: '650', margin: 0, color: colors.textPrimary, lineHeight: 1.35 },
  phase: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
    color: colors.primary, margin: '4px 0 0',
  },
  prompt: { fontSize: font.base, color: colors.textPrimary, margin: 0 },
  hint: { fontSize: font.sm, color: colors.textHint, margin: 0 },
  error: { fontSize: font.sm, color: colors.warningText, margin: 0 },
  row: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  varLabel: { fontSize: font.lg, fontWeight: '700', fontStyle: 'italic', color: colors.textPrimary },
  numberInput: {
    width: '5.5rem', padding: '8px 10px', fontSize: font.base, fontFamily: 'inherit',
    border: `1px solid ${colors.primary}`, borderRadius: radius.sm,
    background: colors.card, color: colors.textPrimary,
  },
  choices: { display: 'flex', flexDirection: 'column', gap: '8px' },
  choice: {
    width: '100%', textAlign: 'left', padding: '10px 13px', fontSize: font.base,
    fontFamily: 'inherit', border: '1px solid', borderRadius: radius.sm, cursor: 'pointer',
    color: colors.textPrimary,
  },
  verdict: {
    fontSize: font.base, padding: '11px 13px', borderRadius: radius.sm,
    border: '1px solid', margin: 0, lineHeight: 1.5,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'baseline' },
  chipLabel: { fontSize: font.sm, color: colors.textHint },
  chip: {
    padding: '5px 11px', fontSize: font.sm, fontFamily: 'inherit', fontStyle: 'italic',
    border: `1px solid ${colors.border}`, borderRadius: radius.sm, background: colors.card,
    color: colors.textSecondary, cursor: 'pointer',
  },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', fontSize: font.base, minWidth: '100%' },
  th: {
    textAlign: 'left', padding: '7px 16px 7px 0', fontSize: font.sm, fontWeight: '650',
    letterSpacing: '0.05em', textTransform: 'uppercase', color: colors.textHint,
    borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap',
  },
  td: {
    padding: '7px 16px 7px 0', borderBottom: `1px solid ${colors.border}`,
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: colors.textPrimary,
  },
  tdEmpty: { padding: '7px 0', color: colors.textHint, fontStyle: 'italic' },
  sentence: { fontSize: font.lg, lineHeight: 2.2, margin: 0, color: colors.textPrimary },
  select: {
    fontSize: font.base, fontFamily: 'inherit', padding: '4px 6px', margin: '0 2px',
    border: '1px solid', borderRadius: radius.sm, background: colors.card,
    color: colors.textPrimary, maxWidth: '100%',
  },
  naming: {
    border: `1px solid ${colors.border}`, borderTop: `3px solid ${colors.primary}`,
    borderRadius: radius.sm, padding: '15px 17px', display: 'flex', flexDirection: 'column',
    gap: '7px',
  },
  namingLabel: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
    color: colors.primary, margin: 0,
  },
  namingTerm: { fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary },
  namingMeans: { fontSize: font.base, fontWeight: '600', margin: 0, color: colors.textPrimary },
  namingElse: { fontSize: font.base, margin: 0, color: colors.textSecondary, lineHeight: 1.55 },
  namingPaper: {
    fontSize: font.base, fontStyle: 'italic', margin: 0, color: colors.textSecondary,
    borderTop: `1px solid ${colors.border}`, paddingTop: '9px',
  },
  namingPaperLabel: {
    fontStyle: 'normal', fontSize: font.sm, fontWeight: '700', letterSpacing: '0.08em',
    textTransform: 'uppercase', color: colors.textHint, marginRight: '8px',
  },
  aside: {
    border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.textHint}`,
    borderRadius: radius.sm, padding: '13px 15px',
  },
  asideHead: { fontSize: font.base, fontWeight: '700', margin: '0 0 5px', color: colors.textPrimary },
  asideBody: { fontSize: font.base, margin: 0, color: colors.textSecondary, lineHeight: 1.55 },
}
