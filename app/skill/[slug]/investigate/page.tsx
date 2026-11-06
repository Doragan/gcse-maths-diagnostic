'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import GridCanvas from '../../../../components/practice/GridCanvas'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { slugToSkillId, skillPath } from '../../../../lib/skills/slug'
import { getInvestigation } from '../../../../data/investigations'
import {
  resolveInvestigation, predictionCorrect, concludeGate, rejectValue, addValue,
  sentenceState, markCheck, nextVariant, stageComplete,
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
  checks: Record<number, CheckState>
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
  checks: {},
  done: false,
})

/** One check question's state: which variant, what was put in, how it went. */
type CheckState = {
  variant: number
  typed: string
  picked: number | null
  placed: GridPoint[]
  answered: boolean
  correct: boolean
}

/** Which of a stage's checks have been attempted, in the shape stageComplete wants. */
const answeredMap = (st: StageState): Record<number, boolean> =>
  Object.fromEntries(Object.entries(st.checks).map(([k, v]) => [Number(k), v.answered]))

const blankCheck = (variant = 0): CheckState =>
  ({ variant, typed: '', picked: null, placed: [], answered: false, correct: false })

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
  /** Which section is on screen. */
  const [current, setCurrent] = useState(0)

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

  function checkState(i: number, c: number): CheckState {
    return states[i].checks[c] ?? blankCheck()
  }

  function updateCheck(i: number, c: number, patch: Partial<CheckState>) {
    setStates(prev => prev.map((st, k) => (k === i
      ? { ...st, checks: { ...st.checks, [c]: { ...(st.checks[c] ?? blankCheck()), ...patch } } }
      : st)))
  }

  function submitCheck(i: number, stage: Stage, c: number) {
    const cs = checkState(i, c)
    if (cs.answered) return
    const variant = stage.check![c].build(cs.variant)
    const right = markCheck(variant, cs, stage.axes)
    updateCheck(i, c, { answered: true, correct: right })
    trackEvent('investigation_check', {
      skill: resolved!.skillId,
      stage: i + 1,
      check: c + 1,
      variant: cs.variant,
      kind: variant.answer.kind,
      correct: right,
    })
  }

  /** A different question, not a second go at the same one. */
  function anotherVariant(i: number, stage: Stage, c: number) {
    const cs = checkState(i, c)
    updateCheck(i, c, blankCheck(nextVariant(cs.variant, stage.check![c].variants)))
    trackEvent('investigation_check_retry', {
      skill: resolved!.skillId, stage: i + 1, check: c + 1,
    })
  }

  const allDone = states.length > 0 && states[states.length - 1].done

  // One section at a time. A "page" the student moves through rather than a
  // Next route: every number in the investigation is drawn once per visit, and
  // a route change would re-mount and re-draw them, so stage 2 would quietly
  // be about a different line from stage 1.
  const onScreen = Math.min(current, resolved.stages.length - 1)

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

        <nav style={styles.pips} aria-label="Progress">
          {resolved.stages.map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.pip,
                ...(i === onScreen ? styles.pipNow : {}),
                ...(states[i]?.done ? styles.pipDone : {}),
              }}
            >
              {i + 1}
            </span>
          ))}
          <span style={styles.pipCount}>
            Section {onScreen + 1} of {resolved.stages.length}
          </span>
        </nav>

        {resolved.stages.map((stage, i) => {
          const st = states[i]
          const locked = i > 0 && !states[i - 1].done
          if (i !== onScreen) return null
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

                  {stage.predict.on.kind === 'grid' && !st.predicted && (
                    <>
                      <figure style={styles.figure}>
                        <GridCanvas
                          grid={stage.predict.on.grid}
                          value={st.placed}
                          onChange={pts => update(i, { placed: pts })}
                        />
                      </figure>
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

                  {/* The reveal: their point and the real answer on the same
                      axes they predicted on. The step exists to be settled by
                      a picture, so taking the picture away the moment they
                      commit is the one thing it must not do. */}
                  {stage.predict.on.kind === 'grid' && st.predicted && stage.predict.reveal && (
                    <figure style={styles.figure}>
                      <GridCanvas
                        grid={stage.predict.reveal}
                        value={st.placed}
                        readOnly
                        showCanonical
                      />
                    </figure>
                  )}

                  {stage.predict.on.kind === 'choice' && (
                    <>
                      {stage.figure && (
                        // A stage that reads a line off the graph needs the
                        // graph on screen before its options mean anything.
                        <figure style={styles.figure}>
                          <GridCanvas grid={stage.figure} value={[]} readOnly />
                        </figure>
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

                      <figure style={styles.figure}>
                        <GridCanvas
                          grid={stage.control.render(st.drawn, st.current)}
                          value={[]}
                          readOnly
                        />
                      </figure>

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

                            {/* 4 · the check. After naming, so a question may
                                use the word it just introduced. */}
                            {(stage.check ?? []).length > 0 && (
                              <>
                                <p style={styles.phase}>4 · Check you have it</p>
                                {(stage.check ?? []).map((check, c) => {
                                  const cs = checkState(i, c)
                                  const variant = check.build(cs.variant)
                                  const a = variant.answer
                                  return (
                                    <div key={c} style={styles.check}>
                                      <p style={styles.checkAsk}>{variant.ask}</p>

                                      {variant.figure && (
                                        <figure style={styles.figure}>
                                          <GridCanvas grid={variant.figure} value={[]} readOnly />
                                        </figure>
                                      )}

                                      {a.kind === 'numeric' && (
                                        <div style={styles.row}>
                                          {a.prefix && (
                                            <span style={styles.varLabel}>{a.prefix}</span>
                                          )}
                                          <input
                                            type="text"
                                            inputMode="text"
                                            value={cs.typed}
                                            disabled={cs.answered}
                                            onChange={e => updateCheck(i, c, { typed: e.target.value })}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault()
                                                submitCheck(i, stage, c)
                                              }
                                            }}
                                            style={styles.numberInput}
                                            aria-label={variant.ask}
                                          />
                                        </div>
                                      )}

                                      {a.kind === 'choice' && (
                                        <div style={styles.choices}>
                                          {a.options.map((opt, k) => (
                                            <button
                                              key={k}
                                              disabled={cs.answered}
                                              onClick={() => updateCheck(i, c, { picked: k })}
                                              style={{
                                                ...styles.choice,
                                                borderColor: cs.picked === k
                                                  ? colors.primary : colors.border,
                                                background: cs.picked === k
                                                  ? colors.cardAlt : colors.card,
                                              }}
                                            >
                                              {opt}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      {a.kind === 'grid' && (
                                        <figure style={styles.figure}>
                                          <GridCanvas
                                            grid={a.grid}
                                            value={cs.placed}
                                            readOnly={cs.answered}
                                            onChange={pts => updateCheck(i, c, { placed: pts })}
                                          />
                                        </figure>
                                      )}

                                      <div style={styles.row}>
                                        {!cs.answered && (
                                          <button
                                            style={{ ...primaryButton, width: 'auto' }}
                                            onClick={() => submitCheck(i, stage, c)}
                                          >
                                            Check
                                          </button>
                                        )}
                                        {cs.answered && (
                                          <button
                                            style={{ ...secondaryButton, width: 'auto' }}
                                            onClick={() => anotherVariant(i, stage, c)}
                                          >
                                            Try another
                                          </button>
                                        )}
                                      </div>

                                      {cs.answered && (
                                        <p style={{
                                          ...styles.verdict,
                                          color: cs.correct
                                            ? colors.successText : colors.warningText,
                                          background: cs.correct
                                            ? colors.successLight : colors.warningLight,
                                          borderColor: cs.correct
                                            ? colors.successBorder : colors.warningBorder,
                                        }}>
                                          <strong>{cs.correct ? '' : 'Not this time. '}</strong>
                                          {cs.correct ? variant.right : variant.wrong}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
              {!locked && (
                <div style={{ ...styles.row, justifyContent: 'space-between' }}>
                  <button
                    style={{ ...secondaryButton, width: 'auto', visibility: onScreen === 0 ? 'hidden' : 'visible' }}
                    onClick={() => setCurrent(onScreen - 1)}
                  >
                    ← Back
                  </button>
                  {onScreen < resolved.stages.length - 1 && (() => {
                    const ready = stageComplete(stage, st.done, answeredMap(st))
                    return (
                    <button
                      // A disabled control that looks enabled reads as a
                      // broken button, not as a step still to finish.
                      style={{
                        ...primaryButton,
                        width: 'auto',
                        opacity: ready ? 1 : 0.45,
                        cursor: ready ? 'pointer' : 'not-allowed',
                      }}
                      title={ready ? undefined : 'Finish the rule and both checks first'}
                      disabled={!ready}
                      onClick={() => {
                        setCurrent(onScreen + 1)
                        window.scrollTo({ top: 0 })
                        trackEvent('investigation_section_done', {
                          skill: resolved.skillId, stage: i + 1,
                        })
                      }}
                    >
                      Next section →
                    </button>
                    )
                  })()}
                </div>
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
  // A grid renders at its container width with its height following the cell
  // ratio, so in a wide column a tall grid fills the screen and the student
  // scrolls past the question to reach it. Capped and centred instead.
  figure: { margin: 0, width: '100%', maxWidth: '420px', alignSelf: 'center' },
  pips: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
  pip: {
    width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', fontSize: font.sm, fontWeight: '700',
    background: colors.card, border: `1px solid ${colors.border}`, color: colors.textHint,
  },
  pipNow: { borderColor: colors.primary, color: colors.primary, background: colors.cardAlt },
  pipDone: { borderColor: colors.success, color: colors.successText, background: colors.successLight },
  pipCount: { fontSize: font.sm, color: colors.textHint, marginLeft: '4px' },
  check: {
    border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  checkAsk: { fontSize: font.base, fontWeight: '600', margin: 0, color: colors.textPrimary },
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
