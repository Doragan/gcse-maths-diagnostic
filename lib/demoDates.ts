/**
 * Dates for the demo dashboards, expressed as offsets from the day the page was
 * rendered instead of literals.
 *
 * The demo dashboards were authored with hard-coded dates ("Last: 20 Mar 2026",
 * homework marked ACTIVE and "Due: 2 May 2026"). Those read fine the month they
 * were written and read as abandoned software six months later — which is
 * precisely the impression a demo sent to a prospective customer must not give.
 *
 * The anchor is computed on the SERVER and passed down as a prop, and every
 * helper here is pure, so server HTML and client hydration agree. Computing
 * `new Date()` inside the client component instead would mismatch: these pages
 * are statically prerendered, so the server's "today" is the build/revalidate
 * date and the browser's is the visitor's.
 *
 * All arithmetic is UTC. A demo timeline does not care about an hour either
 * way, and UTC keeps the anchor from shifting under a visitor's local zone.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MS_PER_DAY = 86_400_000

/** Today as `YYYY-MM-DD` (UTC) — what the server hands the client components. */
export function demoAnchor(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

function shift(anchor: string, offsetDays: number): Date {
  return new Date(Date.parse(`${anchor}T00:00:00Z`) + offsetDays * MS_PER_DAY)
}

/** `YYYY-MM-DD`, for the few places that compare dates rather than show them. */
export function demoDateIso(anchor: string, offsetDays: number): string {
  return shift(anchor, offsetDays).toISOString().slice(0, 10)
}

/** Display form: `20 Mar 2026`. Negative offsets are in the past. */
export function demoDate(anchor: string, offsetDays: number): string {
  const d = shift(anchor, offsetDays)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Chart-axis form: `Mar 26`. */
export function demoMonthLabel(anchor: string, offsetDays: number): string {
  const d = shift(anchor, offsetDays)
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`
}
