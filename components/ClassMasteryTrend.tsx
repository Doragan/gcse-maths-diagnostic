'use client'

import { type TimelinePoint } from '../lib/teacherAnalytics'
import WeeklySparkline from './WeeklySparkline'

/**
 * Class mastery-over-time: the weekly average curriculum-mastery %.
 * A thin wrapper over WeeklySparkline, which holds the chart itself.
 */
export default function ClassMasteryTrend({
  points,
  title = 'Mastery over time',
  caption = 'Class average % of the curriculum mastered, by week. Fills out as the class builds up history.',
}: {
  points: TimelinePoint[]
  title?: string
  caption?: string
}) {
  return (
    <WeeklySparkline
      points={points}
      value={p => p.masteryPct}
      title={title}
      caption={caption}
      nowPrefix="now"
      format={n => `${n}%`}
    />
  )
}
