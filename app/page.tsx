/**
 * The landing page — a SERVER component whose only job is to have the demo
 * question ready before the browser gets involved.
 *
 * Everything visible lives in ./Landing (a client component: the whole page is
 * interactive). What changed is where the demo's data comes from. It used to be
 * a `useEffect` inside that client component, which meant the sequence was
 * HTML → 290 KB of JS → hydrate → query → render, and measured on the live site
 * the question did not appear until ~2.8s, of which the query was only 238ms.
 *
 * Fetching here puts the first question in the HTML instead, so it is on screen
 * as soon as the page paints and does not wait for React at all.
 */

import { fetchDemoPool, renderOne, shuffled } from '../lib/demoQuestions'
import Landing from './Landing'

/**
 * Regenerate this page at most once an hour.
 *
 * Which means the page is served as static HTML from the CDN — the reason it is
 * fast — and, to be clear about the cost: the shuffle and the parameter draw
 * happen at REGENERATION, not per visitor. Everyone arriving within the same
 * hour sees the same opening question with the same numbers.
 *
 * That is an acceptable trade for a landing page. The first question is a
 * shop window, not an assessment; the pool reshuffles hourly, and the moment a
 * visitor presses "Next question" they get a fresh draw rendered client-side.
 * Making it per-visitor would mean rendering dynamically on every request and
 * giving up the CDN, which is most of the speed this change exists to buy.
 */
export const revalidate = 3600

export default async function Page() {
  // A failed fetch must not take the landing page down with it: fetchDemoPool
  // returns [] on error, and the demo renders its own empty state.
  const pool = shuffled(await fetchDemoPool())
  const first = pool.length > 0 ? renderOne(pool[0]) : null

  return <Landing demoPool={pool} demoQuestion={first} />
}
