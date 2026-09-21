/**
 * Whether deleting an account has a Stripe subscription to cancel first, and
 * how to read Stripe's answer.
 *
 * ── The bug this exists to close ────────────────────────────────────────────
 * `/api/account/delete` deleted the auth user and never touched Stripe. The
 * subscription lives in Stripe, keyed by an id held on the `students` row, and
 * deleting the account destroyed that row. So the charge continued every month,
 * against a person who no longer had an account, with nothing left in our
 * database tying the payment to anyone. The billing portal is the only self-serve
 * way to cancel, and deleting the account removes the page it is reached from —
 * so the act of leaving was the act that made leaving impossible.
 *
 * Worse for the parent-paid case (`/pay/[token]`): the payer is a third party who
 * never sees the child's deletion, and would have gone on paying indefinitely for
 * an account that no longer exists.
 *
 * ── Why the decisions are here and not in the route ─────────────────────────
 * Same reason as lib/retention.ts: the action is irreversible and involves other
 * people's money, so the rule is a pure function that can be tested exhaustively
 * without a Stripe account or a database. The route does the IO and nothing else.
 *
 * ── Which way the doubt resolves ────────────────────────────────────────────
 * Retention resolves every doubt towards NOT deleting, because a wrongly kept
 * account is recoverable and a wrongly deleted one is not. Here the safe
 * direction is the opposite: resolve towards CANCELLING. Someone deleting their
 * account has said they want no more of the service, so a subscription cancelled
 * when it need not have been costs them nothing they wanted, while one left
 * running takes money from someone with no way to stop it. Hence an unrecognised
 * status is treated as billable rather than assumed dead.
 */

/**
 * Stripe subscription statuses from which no further charge can ever be made.
 * Everything else is treated as billable, including statuses Stripe may add
 * after this was written.
 *
 * `canceled` is the ordinary end state. `incomplete_expired` is a subscription
 * whose first payment never succeeded within Stripe's window; it is dead and
 * cannot be revived.
 */
export const TERMINAL_STATUSES = ['canceled', 'incomplete_expired'] as const

/**
 * True when the subscription can never charge again, so there is nothing to
 * cancel and account deletion should simply proceed.
 *
 * Unknown, null and empty statuses return false — "I do not recognise this" must
 * resolve to "try to cancel it", never to "assume it is dead".
 */
export function isTerminalStatus(status: string | null | undefined): boolean {
  if (typeof status !== 'string') return false
  return (TERMINAL_STATUSES as readonly string[]).includes(status.trim().toLowerCase())
}

/** The subset of the students row this decision needs. */
export type BillableAccount = {
  stripe_subscription_id?: string | null
}

/**
 * The subscription id to cancel before deleting this account, or null if there
 * is none to cancel.
 *
 * Returns null for a missing row, which is the ordinary case for a teacher:
 * teachers have no `stripe_subscription_id` column at all, and the teacher pass
 * was a one-off payment rather than a subscription, so there has never been
 * anything recurring to cancel on that side.
 *
 * A whitespace-only id is treated as absent. An id that is merely stale — the
 * subscription having already gone from Stripe — is NOT filtered here; that is
 * Stripe's answer to give, and `isMissingFromStripe` reads it.
 */
export function subscriptionToCancel(account: BillableAccount | null | undefined): string | null {
  const id = account?.stripe_subscription_id
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * True when Stripe is telling us the subscription does not exist.
 *
 * This is a SUCCESS for our purposes, not a failure: an id pointing at nothing
 * bills nobody, so deletion should go ahead. It happens with a subscription
 * deleted directly in the Stripe dashboard, or an id left behind by test data.
 *
 * Read from the error's shape rather than its message. Stripe's wording is not a
 * stable interface; `code` and `statusCode` are. A 404 from Stripe means the
 * resource is not there whatever the accompanying prose says.
 */
export function isMissingFromStripe(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { code?: unknown; statusCode?: unknown; type?: unknown }
  if (e.code === 'resource_missing') return true
  if (e.statusCode === 404) return true
  return false
}

/** What happened to the subscription, for logging and for the route's response. */
export type CancelOutcome =
  /** No subscription id on the account. The ordinary case, including every teacher. */
  | { kind: 'none' }
  /** The id pointed at a subscription that was already dead. Nothing was charged. */
  | { kind: 'already_ended'; subscriptionId: string; status: string }
  /** The id pointed at nothing in Stripe at all. */
  | { kind: 'not_in_stripe'; subscriptionId: string }
  /** We cancelled it. This is the case the bug was losing. */
  | { kind: 'cancelled'; subscriptionId: string }

/**
 * Whether the account deletion may now proceed.
 *
 * Every outcome above is a green light: each one means no future charge can
 * reach this person. A Stripe error that is NOT `isMissingFromStripe` produces
 * no outcome at all, and the route stops there rather than deleting — see the
 * route for why blocking is the lesser harm.
 */
export function mayProceedToDelete(outcome: CancelOutcome): boolean {
  return outcome.kind === 'none'
    || outcome.kind === 'already_ended'
    || outcome.kind === 'not_in_stripe'
    || outcome.kind === 'cancelled'
}

/** One line for the server log, so a support question can be answered later. */
export function describeOutcome(outcome: CancelOutcome): string {
  switch (outcome.kind) {
    case 'none':
      return 'no subscription on the account; nothing to cancel'
    case 'already_ended':
      return `subscription ${outcome.subscriptionId} was already ${outcome.status}; nothing to cancel`
    case 'not_in_stripe':
      return `subscription ${outcome.subscriptionId} does not exist in Stripe; nothing to cancel`
    case 'cancelled':
      return `subscription ${outcome.subscriptionId} cancelled before account deletion`
  }
}
