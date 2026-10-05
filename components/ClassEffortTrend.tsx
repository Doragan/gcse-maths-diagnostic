'use client'

import { type TimelinePoint } from '../lib/teacherAnalytics'
import WeeklySparkline from './WeeklySparkline'
import { colors } from '../lib/styles'

/**
 * Questions-answered-per-week. The companion to ClassMasteryTrend: mastery is
 * slow-moving and cumulative, so a hard-working class can look static on it;
 * this series moves daily. Each point is that week's OWN attempts, so it can
 * fall as well as rise.
 *
 * Deliberately carries no target line and no judgement — a quiet week is a
 * number, not a verdict (docs/audit/12 decision 2).
 */
export default function ClassEffortTrend({
  points,
  title = 'Questions answered',
  caption = 'Questions the class answered each week, including the placement test. A quiet week is often a holiday or a busy fortnight of lessons.',
}: {
  points: TimelinePoint[]
  title?: string
  caption?: string
}) {
  return (
    <WeeklySparkline
      points={points}
      value={p => p.attempts}
      title={title}
      caption={caption}
      nowPrefix="this week"
      stroke={colors.success}
    />
  )
}
