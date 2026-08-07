/**
 * The landing page's demo question — pool, types, and rendering.
 *
 * Extracted so the SERVER can fetch and render the first question into the HTML
 * rather than the browser doing it after hydration. Measured on the live site
 * before this existed: the demo's query did not even begin until 2.5s in,
 * because it sat in a useEffect behind 290 KB of JS, and the question appeared
 * at 2.76s. The query itself was 238ms of that — the wait was almost entirely
 * "download and hydrate React first".
 *
 * The pool is deliberately still drawn from the LIVE bank rather than baked in,
 * so the demo shows real published questions; it is just fetched on the server
 * and cached, instead of by every visitor's browser.
 */

import { createClient } from '@supabase/supabase-js'
import { renderQuestion, type Parameters } from './questions/paramEngine'

export type DemoQ = {
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

/** A question with its parameters drawn — plain data, so it crosses the wire. */
export type Rendered = {
  q: DemoQ
  questionHtml: string
  answer: string
  traps: { answer: string; response: string }[]
  explanationHtml: string
}

export function renderOne(q: DemoQ): Rendered {
  const r = renderQuestion(q.question_template, q.answer_template, q.traps ?? [], q.explanation, q.parameters ?? {})
  return { q, questionHtml: r.question, answer: r.answer, traps: r.traps, explanationHtml: r.explanation }
}

const DEMO_COLUMNS =
  'id, question_template, answer_template, answer_type, tolerance, traps, parameters, explanation, requires_simplest, skill_ids'

/**
 * How many questions the demo pool holds.
 *
 * The demo shows ONE at a time and a visitor tries a handful at most, so 60 was
 * 64 KB of payload for nothing. Twelve is ample variety and 11 KB.
 */
const POOL_SIZE = 12

/**
 * Demo-friendly published questions: single-answer, easy to type, no diagram,
 * and carrying a trap — the trap is the whole point, since the demo exists to
 * show the targeted feedback rather than just marking something wrong.
 *
 * Note what is NOT in the SQL: the `<svg` exclusion. As a `not ilike '%<svg%'`
 * it cost ~115ms of the query's ~180ms, because a leading wildcard cannot use
 * an index and Postgres scans. It is a cheap string test once the rows are
 * here, exactly like the `<table` test beside it.
 */
export async function fetchDemoPool(): Promise<DemoQ[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // No session to persist on the server, and nothing to refresh.
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { data, error } = await supabase
    .from('questions')
    .select(DEMO_COLUMNS)
    .eq('is_published', true)
    .is('parts', null)
    .in('answer_type', ['numeric', 'fraction'])
    .lte('difficulty', 3) // keep the front page approachable — no hard Higher-tier questions
    .limit(POOL_SIZE * 3) // room to drop the ones the filters below reject
  if (error || !data) return []

  return (data as DemoQ[])
    .filter(q =>
      Array.isArray(q.traps) && q.traps.length > 0 &&
      !/<svg/i.test(q.question_template) &&
      !/<table/i.test(q.question_template))
    .slice(0, POOL_SIZE)
}

/** Fisher–Yates, so the pool order is not the query's order. */
export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
