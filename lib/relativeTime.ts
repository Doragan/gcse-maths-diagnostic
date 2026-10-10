/**
 * Coarse "when was this" wording for teacher-facing recency columns.
 *
 * Deliberately coarse: a day-level answer is what a teacher acts on, and
 * anything finer (hours, minutes, "active 3 min ago") turns a progress figure
 * into surveillance. See docs/audit/24 §1.
 *
 * `now` is injectable so it can be tested without freezing the clock.
 */
export function ago(iso: string | null, now: number = Date.now()): string {
  if (!iso) return '—'
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const w = Math.floor(days / 7)
  return w === 1 ? 'last week' : `${w} weeks ago`
}
