'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter, useParams } from 'next/navigation'
import GridCanvas from '../../../../components/practice/GridCanvas'
import BankQuestion from '../../../../components/practice/BankQuestion'
import FormulaTriangle from '../../../../components/practice/FormulaTriangle'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { slugToSkillId, skillPath } from '../../../../lib/skills/slug'
import { getInvestigation } from '../../../../data/investigations'
import {
  resolveInvestigation, predictionCorrect, concludeGate, rejectValue, addValue, showTry, triedValue, splitInputs,
  sentenceState, stageComplete, stepNumbers,
} from '../../../../lib/skills/investigation'
import type { Stage, ResolvedInvestigation } from '../../../../data/investigations/types'
import type { GridPoint, RenderedGrid } from '../../../../lib/questions/gridDraw'
import { trackEvent } from '../../../../lib/analytics'
import { colors, font, radius, primaryButton, secondaryButton } from '../../../../lib/styles'

/**
 * The two pieces of markup investigation prose gets:
 *
 *   *word*     italics
 *   {P/100}    a stacked fraction, P over 100
 *
 * Authored strings are plain text everywhere else, and should stay that way —
 * HTML in a data file is a door nobody needs open. But the copy sometimes has
 * to point at part of a word (the "cent" in percent is the whole lesson in that
 * word), and algebra reads far better as P over 100 than as "P ÷ 100". Neither
 * is applied to select options or table cells, which cannot hold markup; a test
 * keeps both out of those, and fails on a brace that is not a fraction.
 */
const MARKUP = /\*([^*]+)\*|\{([^{}/]+)\/([^{}/]+)\}/g

/**
 * What stays on the same line as a fraction. A browser may wrap just before a
 * stacked fraction, which left "multiplier 1 +" at the end of one line and the
 * fraction alone on the next. So the word and operator before it ("1 + ",
 * "(1 − (") and any closing bracket or punctuation after it ("),", "²") are
 * held together with it.
 */
const GLUE_BEFORE = /(?:\S+ )?(?:[+−×÷=-] )?\(?$/
const GLUE_AFTER = /^[)²,.;:]*/

function prose(text: string): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(MARKUP)) {
    const at = m.index ?? 0
    let end = at + m[0].length
    let before = text.slice(last, at)
    if (m[1] !== undefined) {
      if (before) out.push(before)
      out.push(<em key={at}>{m[1]}</em>)
    } else {
      const lead = before.match(GLUE_BEFORE)?.[0] ?? ''
      const trail = text.slice(end).match(GLUE_AFTER)?.[0] ?? ''
      before = before.slice(0, before.length - lead.length)
      if (before) out.push(before)
      out.push(
        <span key={at} style={styles.nowrap}>
          {lead}<Frac num={m[2].trim()} den={m[3].trim()} />{trail}
        </span>,
      )
      end += trail.length
    }
    last = end
  }
  if (last === 0) return text
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** A stacked fraction, the same shape as the bank's frac() helper draws. */
function Frac({ num, den }: { num: string; den: string }) {
  return (
    <span style={styles.frac} role="math" aria-label={`${num} over ${den}`}>
      <span style={styles.fracNum} aria-hidden="true">{num}</span>
      <span style={styles.fracDen} aria-hidden="true">{den}</span>
    </span>
  )
}

/**
 * The response to the answer this student actually gave: the option they
 * picked, or the single response a grid placement gets.
 */
function wrongResponse(stage: Stage, picked: number | null): string {
  const on = stage.predict.on
  if (on.kind === 'grid') return on.wrong
  return picked === null ? '' : on.wrong[picked] ?? ''
}

/**
 * A figure with its animations taken out, leaving it in its finished state —
 * for a student who has asked their device for less motion. The finished state
 * is the elements' own attributes; the animations only lead up to it.
 */
function still(grid: RenderedGrid): RenderedGrid {
  return { ...grid, background: grid.background.replace(/<animate\b[^>]*\/>/g, '') }
}

/**
 * Whether the student DRAWS here ("Draw your own", "Draw it") or tries a value
 * the page then pictures ("Try it yourself", "Try it"). A figure alone used to
 * decide it, which would have told a student typing a percentage to draw.
 */
function drawsIt(stage: Stage): boolean {
  return !!stage.control?.render && (stage.control.verb ?? 'draw') === 'draw'
}

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
  /** What is on the grid, for a control the student taps rather than types. */
  pickedPoints: GridPoint[]
  current: number
  /** The try shown before `current`, for a figure that compares with it (showTry). */
  before?: number
  entryError: string
  typed: string
  slots: Record<number, number>
  checks: Record<number, boolean>
  done: boolean
}

const blankStage = (): StageState => ({
  placed: [],
  picked: null,
  predicted: false,
  predictRight: false,
  drawn: [],
  pickedPoints: [],
  current: 0,
  entryError: '',
  typed: '',
  slots: {},
  checks: {},
  done: false,
})

/** Which of a stage's checks have been attempted, in the shape stageComplete wants. */
const answeredMap = (st: StageState): Record<number, boolean> => st.checks

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
  /** The finished view, which "Finish" on the last section opens. */
  const finishRef = useRef<HTMLElement>(null)
  /**
   * Whether "Finish" has been pressed: the sections give way to a finished
   * view, and the page goes to it. Scrolling to a card under the button was
   * not enough — at the foot of the page there was nowhere to scroll, so the
   * button looked as if it did nothing (review, 2026-11-22). The pips still
   * lead back into any section.
   */
  const [finished, setFinished] = useState(false)
  /**
   * Whether this visit has already recorded investigation_finish. Once per
   * visit: a student who goes back into a section and presses Finish again
   * has not finished twice (docs/audit/32, increment 1).
   */
  const finishLogged = useRef(false)
  useEffect(() => {
    if (finished) finishRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [finished])
  /**
   * A student who has asked their device for less motion gets each figure in
   * its finished state, without the bar growing or shrinking into place.
   */
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(q.matches)
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])

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

  /**
   * Points tapped on the line.
   *
   * Only points ON the line count: the x-coordinates become the same `drawn`
   * list a typed control fills, so the figure, the table and the coverage rule
   * need to know nothing about how the value arrived. A tap that misses is
   * refused with a reason rather than silently dropped.
   */
  function pickPoints(i: number, stage: Stage, pts: GridPoint[]) {
    const pick = stage.control?.pick
    if (!pick) return
    const onLine = pts.filter(pt => Math.abs(pick.m * pt.x + pick.c - pt.y) < 1e-9)
    const missed = pts.length > onLine.length
    update(i, {
      pickedPoints: onLine,
      drawn: onLine.map(pt => pt.x),
      current: Math.max(0, onLine.length - 1),
      before: undefined,
      entryError: missed ? pick.offLine : '',
    })
    if (!missed && onLine.length > st(i).drawn.length) {
      trackEvent('investigation_draw', {
        skill: resolved!.skillId, stage: i + 1, control: stage.control?.name,
        value: onLine[onLine.length - 1].x, nth: onLine.length,
      })
    }
  }

  const st = (i: number) => states[i]

  function draw(i: number, stage: Stage, raw: string) {
    const why = rejectValue(stage, raw)
    if (why) { update(i, { entryError: why }); return }
    const v = triedValue(stage, raw)
    const st = states[i]
    const next = addValue(st.drawn, v)
    const isNew = next.drawn.length > st.drawn.length
    update(i, { ...next, ...showTry(st.drawn, st.current, st.before, next.current), entryError: '', typed: '' })
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

  /** A check has been attempted. Whether it was RIGHT is not what unlocks the
   * section — a student stuck on one must never be trapped on the page. */
  function markAnswered(i: number, c: number) {
    setStates(prev => prev.map((st, k) => (k === i
      ? { ...st, checks: { ...st.checks, [c]: true } }
      : st)))
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

        {investigation.underConstruction && (
          <div style={styles.construction} role="note">
            <strong style={styles.constructionHead}>Under construction</strong>
            {investigation.underConstruction}
          </div>
        )}

        <header>
          <p style={styles.eyebrow}>Investigation · {skill.topic}</p>
          <h1 style={styles.title}>{resolved.title}</h1>
          <p style={styles.lede}>{prose(investigation.outcomes.lead)}</p>
          <p style={styles.outcomesHead}>By the end of this you will be able to:</p>
          <ul style={styles.outcomes}>
            {investigation.outcomes.points.map((o, i) => (
              <li key={i} style={styles.outcome}>{prose(o)}</li>
            ))}
          </ul>
        </header>

        <nav style={styles.pips} aria-label="Progress">
          {resolved.stages.map((_, i) => {
            // Reachable on exactly the rule that "Next section" uses, so the
            // pips cannot become a way round a check. Going BACK is what this
            // is for: a student on section 3 who wants to re-read what c did
            // had only a Back button at the foot of a long section.
            const prev = states[i - 1]
            const reachable = i === 0 || (!!prev
              && stageComplete(resolved.stages[i - 1], prev.done, answeredMap(prev)))
            return (
              <button
                key={i}
                disabled={!reachable}
                onClick={() => { setFinished(false); setCurrent(i); window.scrollTo({ top: 0 }) }}
                aria-current={!finished && i === onScreen ? 'step' : undefined}
                aria-label={`Section ${i + 1}: ${resolved.stages[i].title}${states[i]?.done ? ', done' : ''}`}
                // The number alone says nothing about where it goes; the title
                // does, on hover.
                title={`${i + 1}. ${resolved.stages[i].title}`}
                style={{
                  ...styles.pip,
                  ...(!finished && i === onScreen ? styles.pipNow : {}),
                  ...(states[i]?.done ? styles.pipDone : {}),
                  cursor: reachable ? 'pointer' : 'not-allowed',
                  opacity: reachable ? 1 : 0.5,
                }}
              >
                {i + 1}
              </button>
            )
          })}
          <span style={styles.pipCount}>
            {finished ? 'Finished' : `Section ${onScreen + 1} of ${resolved.stages.length}`}
          </span>
        </nav>

        {resolved.stages.map((stage, i) => {
          const st = states[i]
          const step = stepNumbers(stage)
          const locked = i > 0 && !states[i - 1].done
          if (finished || i !== onScreen) return null
          return (
            <section key={i} style={{ ...styles.card, opacity: locked ? 0.5 : 1 }}>
              {/* A real heading, so a screen reader can move between stages. */}
              <h2 style={styles.stageN}>Stage {i + 1} · {stage.title}</h2>
              <p style={styles.ask}>{prose(stage.ask)}</p>

              {locked ? (
                <p style={styles.hint}>
                  Opens once you have stated the rule in stage {i}.
                </p>
              ) : (
                <>
                  {/* 1 · predict */}
                  <p style={styles.phase}>{step.predict} · Predict</p>
                  <p style={styles.prompt}>{prose(stage.predict.prompt)}</p>

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
                            Submit
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
                      {prose(st.predictRight ? stage.predict.right : wrongResponse(stage, st.picked))}
                    </p>
                  )}

                  {/* The verdict says how they did; this says how to do it,
                      for right and wrong alike. A separate box rather than more
                      of the verdict, so the working is never buried in it and
                      each step gets its own line. */}
                  {st.predicted && (
                    <div style={styles.explain}>
                      <p style={styles.explainHead}>How to work it out</p>
                      {stage.predict.explain.map((line, k) => (
                        <p key={k} style={styles.explainLine}>{prose(line)}</p>
                      ))}
                    </div>
                  )}

                  {/* 2 · change it */}
                  {st.predicted && stage.control && (
                    <>
                      {/* A control with no figure is tried, not drawn. */}
                      <p style={styles.phase}>
                        {step.draw} · {drawsIt(stage) ? 'Draw your own' : 'Try it yourself'}
                      </p>
                      <p style={styles.prompt}>{prose(stage.control.prompt)}</p>

                      {stage.control.pick && (
                        <>
                          <p style={styles.hint}>{prose(stage.control.hint)}</p>
                          {st.entryError && <p role="alert" style={styles.error}>{st.entryError}</p>}
                          <figure style={styles.figure}>
                            <GridCanvas
                              grid={stage.control.render!(st.drawn, st.current)}
                              value={st.pickedPoints}
                              maxPoints={stage.control.pick.maxPoints}
                              onChange={pts => pickPoints(i, stage, pts)}
                            />
                          </figure>
                        </>
                      )}

                      {/* A ratio: a box for each number, colons between, held
                          in `typed` as "a:b:c" until it is tried. */}
                      {!stage.control.pick && stage.control.inputs && (() => {
                        const names = stage.control.inputs
                        const typed = names.map((_, k) => st.typed.split(':')[k] ?? '')
                        const setBox = (k: number, v: string) => typed.map((t, j) => (j === k ? v : t)).join(':')
                        const box = (k: number) => (
                          <input
                            key={k}
                            id={`v-${i}-${k}`}
                            aria-label={names[k]}
                            type="number"
                            inputMode="numeric"
                            value={typed[k]}
                            min={stage.control!.domain.min}
                            max={stage.control!.domain.max}
                            step={stage.control!.domain.step}
                            onChange={e => update(i, { typed: setBox(k, e.target.value) })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); draw(i, stage, st.typed) }
                            }}
                            style={{ ...styles.numberInput, width: '64px' }}
                          />
                        )
                        return (
                          <div style={styles.row}>
                            <label htmlFor={`v-${i}-0`} style={styles.varLabel}>
                              {names.join(' : ')} =
                            </label>
                            {names.flatMap((_, k) => (k === 0
                              ? [box(k)]
                              : [<span key={`c${k}`} aria-hidden="true" style={styles.varLabel}>:</span>, box(k)]))}
                            <button
                              style={{ ...primaryButton, width: 'auto' }}
                              onClick={() => draw(i, stage, st.typed)}
                            >
                              {drawsIt(stage) ? 'Draw it' : 'Try it'}
                            </button>
                          </div>
                        )
                      })()}
                      {!stage.control.pick && !stage.control.inputs && (
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
                          {drawsIt(stage) ? 'Draw it' : 'Try it'}
                        </button>
                      </div>
                      )}
                      {!stage.control.pick && (
                        <>
                          <p style={styles.hint}>{prose(stage.control.hint)}</p>
                          {st.entryError && <p style={styles.error}>{st.entryError}</p>}
                        </>
                      )}

                      {!stage.control.pick && st.drawn.length === 0 && stage.control.suggest && (
                        <div style={styles.chips}>
                          <span style={styles.chipLabel}>stuck? try</span>
                          {stage.control.suggest.map(v => (
                            <button
                              key={v}
                              style={styles.chip}
                              onClick={() => draw(i, stage, stage.control!.inputs
                                ? splitInputs(v, stage.control!.inputs.length).join(':')
                                : String(v))}
                            >
                              {stage.control!.inputs
                                ? stage.control!.label(v)
                                : <>{stage.control!.name} = {String(v).replace('-', '−')}</>}
                            </button>
                          ))}
                        </div>
                      )}

                      {st.drawn.length > 0 && (
                        <div style={styles.chips}>
                          <span style={styles.chipLabel}>
                            {drawsIt(stage) ? 'you have drawn' : 'you have tried'}
                          </span>
                          {st.drawn.map((v, k) => (
                            <button
                              key={v}
                              style={{
                                ...styles.chip,
                                borderColor: k === st.current ? colors.primary : colors.border,
                                color: k === st.current ? colors.primary : colors.textSecondary,
                              }}
                              onClick={() => update(i, showTry(st.drawn, st.current, st.before, k))}
                            >
                              {stage.control!.label(v)}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Above the figure, not under the table: it is an
                          instruction about what to draw NEXT, and under the
                          table it was read after the drawing was done. */}
                      {/* Not before the first value: every rule's first message
                          asks for "a second" something, which reads as nonsense
                          to a student who has not tried one yet. The rule stays
                          shut either way — that is concludeGate's other job. */}
                      {st.drawn.length > 0 && concludeGate(stage, st.drawn) && (
                        <p style={styles.nudge}>{concludeGate(stage, st.drawn)}</p>
                      )}

                      {/* A table-native investigation draws nothing: the
                          numbers in the table ARE the observation. */}
                      {/* The scene and its graph, keyed alike so they are
                          mounted in the same render: every animation starts
                          at 0, so mounting together is what keeps the car on
                          the road and the dot on the line in step. */}
                      {!stage.control.pick && stage.control.render && stage.control.scene && (
                        <figure style={styles.figure}>
                          <GridCanvas
                            key={`scene:${i}:${st.current}:${st.before ?? '-'}:${st.drawn[st.current] ?? '-'}`}
                            grid={reduceMotion
                              ? still(stage.control.scene(st.drawn, st.current, st.before))
                              : stage.control.scene(st.drawn, st.current, st.before)}
                            value={[]}
                            readOnly
                          />
                        </figure>
                      )}
                      {!stage.control.pick && stage.control.render && (
                        <figure style={styles.figure}>
                          <GridCanvas
                            // A fresh canvas for each value shown. A figure's
                            // animations run on its own clock, which starts
                            // when the canvas is created — so without this, a
                            // bar tried second would already be finished.
                            key={`${i}:${st.current}:${st.before ?? '-'}:${st.drawn[st.current] ?? '-'}`}
                            grid={reduceMotion
                              ? still(stage.control.render(st.drawn, st.current, st.before))
                              : stage.control.render(st.drawn, st.current, st.before)}
                            value={[]}
                            readOnly
                          />
                        </figure>
                      )}

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
                              {(stage.control!.rows
                                ? stage.control!.rows(st.drawn).length
                                : st.drawn.length) === 0 ? (
                                <tr>
                                  <td style={styles.tdEmpty} colSpan={stage.observe.headers.length}>
                                    {stage.control!.pick
                                      ? 'Nothing yet — tap two points on the line above.'
                                      : stage.control!.render
                                        ? 'Nothing yet — type a value above and draw it.'
                                        : 'Nothing yet — type a value above and try it.'}
                                  </td>
                                </tr>
                              ) : (stage.control!.rows
                                ? stage.control!.rows(st.drawn)
                                : st.drawn.map(v => stage.control!.row?.(v) ?? [])
                              ).map((cells, r) => (
                                <tr key={r}>
                                  {cells.map((cell, c) => (
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
                    // Shown above the figure instead; here it only gates.
                    if (concludeGate(stage, st.drawn)) return null
                    const state = sentenceState(stage, st.slots)
                    return (
                      <>
                        <p style={styles.phase}>{step.rule} · So what is the rule?</p>
                        <p style={styles.sentence}>
                          {stage.conclude.sentence.map((chunk, k) => (
                            <span key={k}>
                              {prose(chunk)}
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
                            {prose(stage.conclude.slots[state.firstWrong]
                              .diagnosis[st.slots[state.firstWrong]])}
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
                              <strong>That is it. </strong>{prose(stage.conclude.because)}
                            </p>
                            {stage.conclude.algebraLead && (
                              <p style={styles.algebraLead}>{prose(stage.conclude.algebraLead)}</p>
                            )}
                            {stage.conclude.algebra && (
                              <p style={styles.algebra}>{prose(stage.conclude.algebra)}</p>
                            )}

                            {stage.naming && (
                              <div style={styles.naming}>
                                <p style={styles.namingTerm}>
                                  <span style={styles.namingLabel}>
                                    {stage.naming.label ?? 'Definition'}:
                                  </span>
                                  {/* One span: this row is a flex container, and
                                      without it "per" and an italic "cent"
                                      become two items with a gap between. */}
                                  <span>{prose(stage.naming.term)}</span>
                                </p>
                                <p style={styles.namingMeans}>{prose(stage.naming.means)}</p>
                                {stage.naming.triangle && <FormulaTriangle {...stage.naming.triangle} />}
                                <p style={styles.namingElse}>{prose(stage.naming.elsewhere)}</p>
                                <p style={styles.namingPaper}>
                                  <span style={styles.namingPaperLabel}>On the paper</span>
                                  {prose(stage.naming.onThePaper)}
                                </p>
                              </div>
                            )}

                            {stage.aside && (
                              <div style={styles.aside}>
                                <p style={styles.asideHead}>{prose(stage.aside.head)}</p>
                                <p style={styles.asideBody}>{prose(stage.aside.body)}</p>
                              </div>
                            )}

                            {/* 4 · the check. Questions from the bank, so a
                                wrong answer gets the author's own trap
                                explanation rather than a restatement. */}
                            {(stage.check ?? []).length > 0 && (
                              <>
                                {/* A section whose only check is a challenge
                                    gets no heading: "Check you have it" over
                                    nothing but an optional harder question
                                    reads as a question that failed to load. */}
                                {(stage.check ?? []).some(c => !c.challenge) && (
                                  <p style={styles.phase}>{step.check} · Check you have it</p>
                                )}
                                {(stage.check ?? []).map((check, c) => (
                                  <div key={check.questionId} style={styles.check}>
                                    {check.challenge && (
                                      <p style={styles.challenge}>
                                        Challenge — harder than this section needs
                                      </p>
                                    )}
                                    {check.note && (
                                      <p style={styles.checkNote} role="note">{prose(check.note)}</p>
                                    )}
                                    <BankQuestion
                                      questionId={check.questionId}
                                      // A check that cannot load must not
                                      // trap the student on the section.
                                      onUnavailable={() => markAnswered(i, c)}
                                      onAnswered={o => {
                                        markAnswered(i, c)
                                        trackEvent('investigation_check', {
                                          skill: resolved!.skillId,
                                          stage: i + 1,
                                          check: c + 1,
                                          question: o.questionId,
                                          correct: o.correct,
                                          misconception: o.misconception,
                                        })
                                      }}
                                    />
                                  </div>
                                ))}
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
                  {/* On EVERY section, the last included. It used to stop at the
                      second-to-last, which left "Back" as the only button at
                      the foot of the last section — the button a student
                      finishing up was most likely to click next. */}
                  {(() => {
                    const ready = stageComplete(stage, st.done, answeredMap(st))
                    const last = onScreen === resolved.stages.length - 1
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
                      title={ready ? undefined : 'Finish the rule and have a go at the check first'}
                      disabled={!ready}
                      onClick={() => {
                        if (last) {
                          if (!finishLogged.current) {
                            finishLogged.current = true
                            trackEvent('investigation_finish', { skill: resolved.skillId })
                          }
                          setFinished(true)
                        } else {
                          setCurrent(onScreen + 1)
                          window.scrollTo({ top: 0 })
                        }
                        trackEvent('investigation_section_done', {
                          skill: resolved.skillId, stage: i + 1,
                        })
                      }}
                    >
                      {last ? 'Finish →' : 'Next section →'}
                    </button>
                    )
                  })()}
                </div>
              )}
            </section>
          )
        })}

        {allDone && finished && (
          <section ref={finishRef} style={{ ...styles.card, borderColor: colors.primary }}>
            <p style={styles.finishedHead}>You have finished {resolved.title}</p>
            <p style={styles.outcomesHead}>You can now:</p>
            <ul style={styles.ticks}>
              {investigation.outcomes.points.map((o, i) => (
                <li key={i} style={styles.tick}>
                  <span aria-hidden="true" style={styles.tickMark}>✓</span>
                  <span>{prose(o)}</span>
                </li>
              ))}
            </ul>
            <p style={styles.h}>Now try it on real questions</p>
            <p style={styles.prompt}>
              Nothing in the investigation counted towards your progress. These do — they are
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
                How to prepare for this in an exam
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  outcomesHead: {
    fontSize: font.base, color: colors.textSecondary, margin: '10px 0 4px',
  },
  // NOT a flex column: flex items are not list-items, so the bullet markers
  // vanish and the list reads as four stray indented lines.
  // listStyleType is set explicitly: the global reset clears it on every ul,
  // so inheriting leaves four stray indented lines with no bullets.
  outcomes: {
    margin: 0, paddingLeft: '22px', listStyleType: 'disc',
  },
  outcome: {
    fontSize: font.base, color: colors.textSecondary, lineHeight: 1.5, marginBottom: '3px',
  },
  finishedHead: { fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary },
  ticks: { margin: '0 0 6px', padding: 0, listStyleType: 'none' },
  tick: {
    display: 'flex', gap: '8px', fontSize: font.base, color: colors.textPrimary,
    lineHeight: 1.5, marginBottom: '4px',
  },
  tickMark: { color: colors.successText, fontWeight: '700' },
  construction: {
    border: `1px solid ${colors.warningBorder}`,
    background: colors.warningLight,
    color: colors.warningText,
    borderRadius: radius.sm,
    padding: '12px 15px',
    fontSize: font.base,
    lineHeight: 1.55,
  },
  constructionHead: { display: 'block', marginBottom: '3px' },
  page: { minHeight: '100vh', background: colors.background, padding: '24px 16px 64px' },
  wrap: { maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' },
  eyebrow: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.09em', textTransform: 'uppercase',
    color: colors.textHint, margin: 0,
  },
  title: { fontSize: font.xl, fontWeight: '750', margin: '6px 0 0', color: colors.textPrimary },
  // No width cap of its own. It used to stop at 36em inside a 760px page, which
  // wrapped the opening into twice the lines it needed above every stage.
  lede: { fontSize: font.base, color: colors.textSecondary, margin: '8px 0 0' },
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
  // Deliberately louder than a hint: it is the one instruction in the section
  // that changes what the student does next, and as grey small print under the
  // table it was missed.
  nudge: {
    margin: 0,
    padding: '12px 14px',
    fontSize: font.base,
    fontWeight: '600',
    color: colors.warningText,
    background: colors.warningLight,
    border: `1px solid ${colors.warningBorder}`,
    borderLeft: `4px solid ${colors.warning}`,
    borderRadius: radius.sm,
  },
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
  // Matches the "Why" box under a bank question's verdict, so the two read as
  // the same thing wherever a student meets them.
  explain: {
    border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  explainHead: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase',
    color: colors.textHint, margin: '0 0 4px',
  },
  explainLine: { fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: 1.6 },
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
    color: colors.primary, marginRight: '10px',
  },
  namingTerm: {
    fontSize: font.lg, fontWeight: '700', margin: 0, color: colors.textPrimary,
    display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px',
  },
  // Monospace and indented: it is a line of working, and it reads as one.
  algebraLead: {
    fontSize: font.base, margin: '0 0 8px', color: colors.textSecondary, lineHeight: 1.55,
  },
  algebra: {
    margin: 0,
    padding: '10px 14px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: font.base,
    color: colors.textPrimary,
    background: colors.cardAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    overflowX: 'auto',
    // Authored over several lines, so it reads as working rather than as one
    // long run-on.
    whiteSpace: 'pre-line',
  },
  challenge: {
    margin: 0,
    fontSize: font.sm,
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: colors.warningText,
  },
  // Said before the question, in the page's own voice — not a warning, so not
  // in the warning colours; a quiet aside with a rule down its edge.
  checkNote: {
    margin: 0, padding: '8px 12px', fontSize: font.base, lineHeight: 1.55,
    color: colors.textSecondary, background: colors.cardAlt,
    borderLeft: `3px solid ${colors.primary}`, borderRadius: radius.sm,
  },
  // The same proportions as the bank's frac(): inline, centred on the line,
  // slightly smaller, a rule under the numerator.
  frac: {
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    verticalAlign: 'middle', margin: '0 3px', fontSize: '0.9em', lineHeight: 1.3,
  },
  fracNum: { borderBottom: '1px solid currentColor', padding: '0 4px', textAlign: 'center' },
  fracDen: { padding: '0 4px', textAlign: 'center' },
  nowrap: { whiteSpace: 'nowrap' },
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
