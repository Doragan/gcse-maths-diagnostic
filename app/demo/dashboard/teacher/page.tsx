/**
 * /demo/dashboard/teacher — stop 4 of the tour.
 *
 * A thin SERVER wrapper whose only job is to date the sample data: it computes
 * "today" once per revalidation and hands it to the client component, which
 * derives every displayed date from it (see lib/demoDates.ts). Computing the
 * date inside the client component instead would disagree with this
 * statically-prerendered HTML and trip a hydration mismatch.
 */

import type { Metadata } from 'next'
import { demoAnchor } from '../../../../lib/demoDates'
import TeacherDemo from './TeacherDemo'

/** See the note on ../../page.tsx — static pages need real metadata. */
export const metadata: Metadata = {
  title: 'Teacher dashboard demo',
  description: 'A sample teacher dashboard: class mastery over time, common gaps, students needing support, and homework.',
}

/** Hourly — the sample class only needs to be dated to the day. */
export const revalidate = 3600

export default function DemoTeacherDashboardPage() {
  return <TeacherDemo anchor={demoAnchor()} />
}
