/**
 * Sending a parent-pay link (docs/audit/24, Part 2 / B3).
 *
 * Two surfaces generate the same link and shared it in the same three ways —
 * /student/upgrade and FounderUpgradeModal — with the wording and the copy
 * fallback written out twice. This holds both, so the tracking exists once and
 * the two copies cannot drift.
 *
 * Why the tracking matters: `parent_pay_link_created` already fires when the
 * link is GENERATED. Nothing fired when it was actually sent, so "the student
 * made a link" and "the student sent it to someone" were indistinguishable —
 * which is the first step of the only funnel this feature has.
 */

export type ShareMethod = 'copy' | 'email' | 'share'

/** Where the share happened, so the two surfaces stay separable in analytics. */
export type ShareSource = 'upgrade_page' | 'founder_popup' | 'exam_quota'

/** What the parent is being asked to pay for, in the student's own words. */
export type ShareSubject = 'subscription' | 'pass'

function noun(subject: ShareSubject): string {
  return subject === 'pass' ? 'GCSE Maths pass' : 'GCSE Maths subscription'
}

/** The one-liner used by the Web Share sheet and the copy fallback. */
export function parentShareText(url: string, subject: ShareSubject = 'subscription'): string {
  return `Please could you help pay for my Mathsense ${noun(subject)}? You can pay securely here: ${url}`
}

export function parentShareSubject(subject: ShareSubject = 'subscription'): string {
  return `Please help pay for my Mathsense ${noun(subject)}`
}

export function parentShareBody(url: string, subject: ShareSubject = 'subscription'): string {
  return `Hi,\n\nPlease could you help pay for my Mathsense ${noun(subject)}? You can choose a plan and pay securely here:\n\n${url}\n\nThank you!`
}

/** `mailto:` for the prefilled email, encoded. */
export function parentMailto(url: string, subject: ShareSubject = 'subscription'): string {
  return `mailto:?subject=${encodeURIComponent(parentShareSubject(subject))}`
    + `&body=${encodeURIComponent(parentShareBody(url, subject))}`
}

function recordShare(method: ShareMethod, source: ShareSource, extra: Record<string, unknown> = {}) {
  // Imported lazily, and fire-and-forget: lib/analytics instantiates the
  // Supabase client at module load, so a static import would drag env vars
  // into every unit test of the wording above. lib/teacherAnalytics defers its
  // supabase import for the same reason. Analytics must never block a share.
  import('./analytics')
    .then(({ trackEvent }) => trackEvent('parent_pay_link_shared', { method, source, ...extra }))
    .catch(() => {})
}

/**
 * Copy to the clipboard. Returns false when the clipboard is unavailable or
 * refused, so the caller can tell the student to copy it by hand.
 */
export async function copyParentLink(
  url: string,
  source: ShareSource,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url)
    recordShare('copy', source, extra)
    return true
  } catch {
    return false
  }
}

/** Open the mail client with the message prefilled. */
export function emailParentLink(url: string, source: ShareSource, subject: ShareSubject = 'subscription'): void {
  recordShare('email', source)
  window.location.href = parentMailto(url, subject)
}

/**
 * The native share sheet, falling back to a copy where there isn't one.
 *
 * Only records a share once `navigator.share` RESOLVES. It rejects when the
 * student dismisses the sheet, and counting a dismissal as a send would defeat
 * the point of measuring this at all.
 */
export async function shareParentLink(
  url: string,
  source: ShareSource,
  subject: ShareSubject = 'subscription',
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Mathsense', text: parentShareText(url, subject), url })
      recordShare('share', source)
      return true
    } catch {
      return false // dismissed, or the sheet failed — not a send
    }
  }
  return copyParentLink(url, source, { fellBackFrom: 'share' })
}
