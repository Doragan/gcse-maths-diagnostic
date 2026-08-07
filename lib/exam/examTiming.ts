/**
 * Exam conditions: the clock.
 *
 * A mini-exam already withholds feedback until submit, which is half of sitting
 * a paper. The other half is that the time is not yours — pace is a real exam
 * skill, and a student who can solve everything given an afternoon still fails a
 * paper. This module is the pure arithmetic of that clock; the countdown itself
 * lives in the runner.
 *
 * The allowance comes from the real thing rather than a round number: AQA GCSE
 * Maths is 80 marks in 90 minutes on every paper of both tiers, so 1 mark buys
 * 67.5 seconds. Deriving from the paper's OWN total keeps a 23-mark paper
 * honest against a 27-mark one, which matters because the marks-first assembler
 * lets the total move a mark or two either way.
 *
 * Pure: no timers, no React. The runner reads the wall clock and asks these
 * functions what it means.
 */

/** 90 minutes ÷ 80 marks, from every paper in the coded 2024 series. */
export const EXAM_SECONDS_PER_MARK = (90 * 60) / 80

/**
 * The allowance for a paper of this many marks, to the nearest half-minute.
 *
 * Rounded because a countdown starting at "28:07" reads like a stopwatch that
 * was already running; a clean figure reads like an allowance.
 */
export function allowanceSeconds(totalMarks: number): number {
  if (!Number.isFinite(totalMarks) || totalMarks <= 0) return 0
  return Math.round((totalMarks * EXAM_SECONDS_PER_MARK) / 30) * 30
}

/**
 * Seconds left, from the wall clock.
 *
 * Deliberately computed from a start TIMESTAMP rather than decremented by an
 * interval: a background tab has its timers throttled to once a minute or
 * stopped altogether, so a decrementing counter would silently hand back the
 * time a student spent in another tab. Reading the clock cannot drift.
 *
 * Never negative — "overdue" is not a state the paper has, because the runner
 * submits at zero.
 */
export function remainingSeconds(startedAt: number, allowed: number, now: number): number {
  return Math.max(0, Math.round(allowed - (now - startedAt) / 1000))
}

/** Whole seconds elapsed, for the record of how long a paper actually took. */
export function elapsedSeconds(startedAt: number, now: number): number {
  return Math.max(0, Math.round((now - startedAt) / 1000))
}

/** Below this many seconds the countdown turns amber: time to move on. */
export const WARN_SECONDS = 5 * 60
/** Below this it turns red — the last minute. */
export const URGENT_SECONDS = 60

export type ClockUrgency = 'normal' | 'warn' | 'urgent'

export function urgencyOf(remaining: number): ClockUrgency {
  if (remaining <= URGENT_SECONDS) return 'urgent'
  if (remaining <= WARN_SECONDS) return 'warn'
  return 'normal'
}

/** "28:00", "4:07", "0:09" — minutes and seconds, as an exam clock reads. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * How long a paper took, in prose for the review ("21 minutes", "1 min 5 secs").
 * Minutes alone once past a minute — nobody reads a paper time to the second.
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`
  const mins = Math.round(s / 60)
  return `${mins} minute${mins === 1 ? '' : 's'}`
}
