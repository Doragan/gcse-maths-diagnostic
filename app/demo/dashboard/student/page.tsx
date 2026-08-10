/**
 * /demo/dashboard/student — stop 4 of the tour, the learner's half.
 *
 * Thin SERVER wrapper, same reasoning as the teacher one next door: the anchor
 * date is computed here so the sample term always ends "recently", and so the
 * prerendered HTML and the hydrated client agree on what today is.
 */

import type { Metadata } from 'next'
import { demoAnchor } from '../../../../lib/demoDates'
import StudentDemo from './StudentDemo'

/** See the note on ../../page.tsx — static pages need real metadata. */
export const metadata: Metadata = {
  title: 'Student dashboard demo',
  description: 'A sample student dashboard: skill mastery over time, results by topic, homework and next steps.',
}

export const revalidate = 3600

export default function DemoStudentDashboardPage() {
  return <StudentDemo anchor={demoAnchor()} />
}
