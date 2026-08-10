/**
 * /demo/questions — stop 2 of the tour: what the question bank can ask.
 *
 * A SERVER component for the same reason the landing page is one: the whole
 * point of the page is a wall of rendered questions, and a prospect who was
 * sent this link should see them in the first paint rather than after a
 * few-hundred-KB hydrate. Everything interactive (the "try it live" tracking)
 * lives in ./Showcase.
 */

import type { Metadata } from 'next'
import { fetchShowcase, fetchBankStats } from '../../../lib/demoShowcase'
import Showcase from './Showcase'

/** See the note on ../page.tsx — static pages need real metadata, not the map. */
export const metadata: Metadata = {
  title: 'Question showcase',
  description:
    'What the Mathsense question bank can ask: diagrams, multi-part exam stems with marks, drawing on a grid, frequency trees, and multi-skill synthesis — all playable.',
  openGraph: {
    title: 'Mathsense question showcase',
    description:
      'Diagrams, multi-part exam stems, drawing on a grid, frequency trees and multi-skill synthesis — real GCSE questions, all playable.',
  },
}

/**
 * Regenerate hourly. The parameter draw therefore happens at regeneration, so
 * every visitor within the hour sees the same numbers — fine here, since these
 * cards are a shop window and "Try it live" hands off to /practice for a fresh
 * draw. In exchange the page is static HTML off the CDN.
 */
export const revalidate = 3600

export default async function DemoQuestionsPage() {
  // Both fall back to a null/empty state rather than throwing: a prospect
  // following a link we sent them must never land on an error page.
  const [questions, stats] = await Promise.all([fetchShowcase(), fetchBankStats()])
  return <Showcase questions={questions} stats={stats} />
}
