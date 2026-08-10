/**
 * /demo — the single link to send a prospective teacher or tutor.
 *
 * Before this existed the demo assets were three unlinked URLs (the marking
 * tool, the teacher dashboard, the student dashboard) that had to be sent
 * together with an email explaining the order to open them in. This is that
 * email, as a page, with the live product attached to each step.
 *
 * A SERVER component so stop 1's question is in the first paint — same reason
 * and same pool as the landing page (see lib/demoQuestions.ts).
 */

import type { Metadata } from 'next'
import { fetchDemoPool, renderOne, shuffled } from '../../lib/demoQuestions'
import { fetchBankStats } from '../../lib/demoShowcase'
import DemoTour from './DemoTour'

/**
 * Real metadata rather than relying on the central title map.
 *
 * lib/pageTitles.ts sets document.title from an effect, which works on the
 * dynamically-rendered pages but loses to the root layout's title on a
 * statically prerendered one like this. This route is also the link that gets
 * pasted into an email or a WhatsApp thread, so the description is what a
 * prospect sees before they click — worth writing rather than inheriting.
 */
export const metadata: Metadata = {
  title: 'See how Mathsense works — a 10-minute guided tour',
  description:
    'A four-stop tour for teachers and tutors: try a real question, see the range of the question bank, mark a past paper, and see the dashboards. No account needed.',
  openGraph: {
    title: 'See how Mathsense works — a 10-minute guided tour',
    description:
      'For teachers and tutors: try a real question, see the question bank, mark a past paper, see the dashboards. No account needed.',
  },
}

/** Hourly, matching the landing page — see the note on app/page.tsx. */
export const revalidate = 3600

export default async function DemoPage() {
  // Both helpers degrade to empty rather than throwing: a prospect following a
  // link we sent them must never land on an error page.
  const [pool, stats] = await Promise.all([fetchDemoPool(), fetchBankStats()])
  const shuffledPool = shuffled(pool)
  const first = shuffledPool.length > 0 ? renderOne(shuffledPool[0]) : null

  return <DemoTour demoPool={shuffledPool} demoQuestion={first} stats={stats} />
}
