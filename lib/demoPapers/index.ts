import type { PaperConfig } from './types'

// Foundation — hand-authored, and the only ones carrying retry and challenge
// questions (see the note on PAPERS below).
import { AQA_8300_1F_NOV24 } from './aqa-8300-1f-nov24'
import { AQA_8300_2F_NOV24 } from './aqa-8300-2f-nov24'
import { AQA_8300_3F_NOV24 } from './aqa-8300-3f-nov24'

// Higher — generated from data/exam-audit/ by
// scripts/generate-paper-from-audit.ts.
import { AQA_8300_1H_JUN25 } from './aqa-8300-1h-jun25'
import { AQA_8300_2H_JUN25 } from './aqa-8300-2h-jun25'
import { AQA_8300_3H_JUN25 } from './aqa-8300-3h-jun25'
import { AQA_8300_1H_NOV24 } from './aqa-8300-1h-nov24'
import { AQA_8300_2H_NOV24 } from './aqa-8300-2h-nov24'
import { AQA_8300_3H_NOV24 } from './aqa-8300-3h-nov24'
import { AQA_8300_1H_JUN24 } from './aqa-8300-1h-jun24'
import { AQA_8300_2H_JUN24 } from './aqa-8300-2h-jun24'
import { AQA_8300_3H_JUN24 } from './aqa-8300-3h-jun24'
import { AQA_8300_1H_NOV23 } from './aqa-8300-1h-nov23'
import { AQA_8300_2H_NOV23 } from './aqa-8300-2h-nov23'
import { AQA_8300_3H_NOV23 } from './aqa-8300-3h-nov23'
import { AQA_8300_1H_JUN23 } from './aqa-8300-1h-jun23'
import { AQA_8300_2H_JUN23 } from './aqa-8300-2h-jun23'
import { AQA_8300_3H_JUN23 } from './aqa-8300-3h-jun23'

export type { PaperConfig, PaperTopic, PaperQuestion, PaperRetryQuestion, PaperChallengeQuestion } from './types'

/**
 * Every paper the marking tool knows about, keyed by id.
 *
 * ORDER MATTERS — the paper picker renders Object.values(PAPERS) as it stands,
 * so this list is NEWEST SERIES FIRST. A teacher marking an autumn mock reaches
 * for the most recent papers, and scrolling past three years of history to find
 * them is the sort of friction that ends with the tool unused.
 *
 * TWO KINDS OF PAPER LIVE HERE, and the difference shows on a feedback sheet:
 *
 *   • The three Foundation papers are HAND-AUTHORED and carry `retrySet` and
 *     `challengeQuestions`, so their sheets include "Practise these" and "Push
 *     yourself".
 *
 *   • The fifteen Higher papers are GENERATED from data/exam-audit/, which
 *     transcribes no exam text. Their sheets carry the score, coverage, topic
 *     and skill breakdown and the WWW/EBI prose, and simply omit those two
 *     sections rather than printing empty headings. Filling in either object in
 *     a generated file turns its section back on with no other change.
 *
 * Adding a paper is still "write a file matching PaperConfig, add it here" —
 * for an audited paper, the script writes the file for you.
 *
 * NOTE FOR THE PAID PATH: recording a sitting also needs anchor rows in the
 * `questions` table, created by scripts/sync-paper-items.ts. Until that has
 * been run for a paper, POST /api/papers/sittings rejects it with "not set up
 * for tracking yet". The FREE tool at /mark needs no anchors — it writes
 * nothing — so a newly added paper works there immediately.
 */
export const PAPERS: Record<string, PaperConfig> = {
  // June 2025
  [AQA_8300_1H_JUN25.id]: AQA_8300_1H_JUN25,
  [AQA_8300_2H_JUN25.id]: AQA_8300_2H_JUN25,
  [AQA_8300_3H_JUN25.id]: AQA_8300_3H_JUN25,

  // November 2024
  [AQA_8300_1F_NOV24.id]: AQA_8300_1F_NOV24,
  [AQA_8300_2F_NOV24.id]: AQA_8300_2F_NOV24,
  [AQA_8300_3F_NOV24.id]: AQA_8300_3F_NOV24,
  [AQA_8300_1H_NOV24.id]: AQA_8300_1H_NOV24,
  [AQA_8300_2H_NOV24.id]: AQA_8300_2H_NOV24,
  [AQA_8300_3H_NOV24.id]: AQA_8300_3H_NOV24,

  // June 2024
  [AQA_8300_1H_JUN24.id]: AQA_8300_1H_JUN24,
  [AQA_8300_2H_JUN24.id]: AQA_8300_2H_JUN24,
  [AQA_8300_3H_JUN24.id]: AQA_8300_3H_JUN24,

  // November 2023
  [AQA_8300_1H_NOV23.id]: AQA_8300_1H_NOV23,
  [AQA_8300_2H_NOV23.id]: AQA_8300_2H_NOV23,
  [AQA_8300_3H_NOV23.id]: AQA_8300_3H_NOV23,

  // June 2023
  [AQA_8300_1H_JUN23.id]: AQA_8300_1H_JUN23,
  [AQA_8300_2H_JUN23.id]: AQA_8300_2H_JUN23,
  [AQA_8300_3H_JUN23.id]: AQA_8300_3H_JUN23,
}

/**
 * Unchanged deliberately. This is the paper the marking pages open on, it is
 * the one the demo tour and its screenshots use, and it is hand-authored — so a
 * first-time visitor lands on the paper with the richest sheet rather than on
 * whichever paper happens to sort first.
 */
export const DEFAULT_PAPER_ID = AQA_8300_3F_NOV24.id
