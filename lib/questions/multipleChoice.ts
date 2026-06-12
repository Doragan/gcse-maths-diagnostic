import { evaluateTemplate } from './paramEngine'
import { normalise } from './answerChecker'

/**
 * Dedupe options by NORMALISED value, preserving first-seen order (audit L6).
 * Stops two options that are value-equal but differ in format/whitespace (or a
 * trap that coincides with the answer on some draw) appearing as "duplicate"
 * choices. The correct answer is passed first, so it always survives.
 */
function dedupeByValue(opts: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const o of opts) {
    const key = normalise(o)
    if (!seen.has(key)) { seen.add(key); out.push(o) }
  }
  return out
}

/**
 * Produce the option list for a multiple-choice question.
 *
 * Two modes:
 *  - EXPLICIT (author-supplied): when `explicit` holds 2+ rendered options,
 *    they are used verbatim — shuffled only, never padded or trimmed. This is
 *    how categorical sets (all/some/no, yes/no) and fixed 4-expression lists
 *    are expressed. The correct answer is guaranteed present (prepended if the
 *    author's list happens not to contain it, so the question stays answerable).
 *  - DERIVED (default / legacy): when no explicit options are given, build from
 *    the correct answer + trap answers, padding to 4 with generated near-misses.
 */
export function buildOptions(
  correct: string,
  traps: { answer: string }[],
  explicit?: string[] | null
): string[] {
  if (explicit && explicit.length >= 2) {
    const hasCorrect = explicit.some(o => normalise(o) === normalise(correct))
    const opts = hasCorrect ? explicit : [correct, ...explicit]
    return shuffle(dedupeByValue(opts))
  }

  // Correct first, then traps — deduped by value so a trap equal to the answer
  // (or to another trap) can't show up twice.
  const options = dedupeByValue([correct, ...traps.map(t => t.answer)])

  // Pad to 4 if needed, skipping any padding value that duplicates an existing one.
  if (options.length < 4) {
    const seen = new Set(options.map(normalise))
    for (const p of generatePadding(correct, options)) {
      if (options.length >= 4) break
      const key = normalise(p)
      if (!seen.has(key)) { seen.add(key); options.push(p) }
    }
  }

  // Trim to 4 and shuffle
  return shuffle(options.slice(0, 4))
}

/** Fisher–Yates shuffle, returning a new array (does not mutate the input). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Normalise the editable MC-option list from the authoring form into the value
 * persisted in the `mc_options` column: a trimmed array of 2+ templates, or
 * null (making buildOptions fall back to derived distractors at render time).
 * Returns null for multi-part questions — they have no question-level MC
 * presentation — and for any non-MC question type.
 */
export function cleanMcOptions(
  isMulti: boolean,
  data: { question_type?: string, mc_options?: string[] | null }
): string[] | null {
  if (isMulti || data.question_type !== 'multiple_choice') return null
  const cleaned = (data.mc_options ?? []).map(o => o.trim()).filter(o => o !== '')
  return cleaned.length >= 2 ? cleaned : null
}

/**
 * Render author-supplied explicit MC option templates against a generated
 * value set (the same `{{...}}` engine used for the question/answer/traps, so
 * options can carry parameters). Returns null when there are no explicit
 * options, signalling callers to fall back to buildOptions' derived path.
 */
export function renderMcOptions(
  templates: string[] | null | undefined,
  values: Record<string, number>
): string[] | null {
  if (!templates || templates.length === 0) return null
  const rendered = templates
    .map(t => evaluateTemplate(t, values))
    .filter(o => o.trim() !== '')
  return rendered.length >= 2 ? rendered : null
}

function generatePadding(correct: string, existing: string[]): string[] {
  const extras: string[] = []

  // Try numeric variants first
  const num = parseFloat(correct.replace(/[^0-9.\-]/g, ''))
  if (!isNaN(num) && correct.trim() === num.toString()) {
    const candidates = [num + 1, num - 1, num + 2, num - 2]
      .map(n => n.toString())
      .filter(c => !existing.includes(c))
    return candidates
  }

  // Sign swap for expressions like (x + 3)(x − 5)
  const signSwapped = correct
    .replace(/\+/g, '§')
    .replace(/−/g, '+')
    .replace(/§/g, '−')
  if (!existing.includes(signSwapped)) extras.push(signSwapped)

  // Replace digits with nearby values
  const digits = correct.match(/\d+/g)
  if (digits) {
    for (const d of [...new Set(digits)]) {
      const n = parseInt(d)
      const v1 = correct.replace(new RegExp(`\\b${d}\\b`), (n + 1).toString())
      const v2 = correct.replace(new RegExp(`\\b${d}\\b`), (n + 2).toString())
      if (!existing.includes(v1) && !extras.includes(v1)) extras.push(v1)
      if (!existing.includes(v2) && !extras.includes(v2)) extras.push(v2)
      if (extras.length >= 3) break
    }
  }

  return extras
}