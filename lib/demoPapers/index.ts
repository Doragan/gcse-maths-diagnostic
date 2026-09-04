import type { PaperConfig } from './types'

// ── Hand-authored ───────────────────────────────────────────────────────────
// The only papers carrying retrySet and challengeQuestions. See PAPERS below.
import { AQA_8300_1F_NOV24 } from './aqa-8300-1f-nov24'
import { AQA_8300_2F_NOV24 } from './aqa-8300-2f-nov24'
import { AQA_8300_3F_NOV24 } from './aqa-8300-3f-nov24'

// ── Generated from data/exam-audit/ by scripts/generate-paper-from-audit.ts ──
// Edexcel — coded from the published QP and mark scheme; the JSON's
// coding_notes record the tagging judgements it needed.
import { EDEXCEL_1MA1_1F_JUN25 } from './edexcel-1ma1-1f-jun25'
import { EDEXCEL_1MA1_2F_JUN25 } from './edexcel-1ma1-2f-jun25'
import { EDEXCEL_1MA1_3F_JUN25 } from './edexcel-1ma1-3f-jun25'
import { EDEXCEL_1MA1_1H_JUN25 } from './edexcel-1ma1-1h-jun25'
import { EDEXCEL_1MA1_2H_JUN25 } from './edexcel-1ma1-2h-jun25'
import { EDEXCEL_1MA1_3H_JUN25 } from './edexcel-1ma1-3h-jun25'

// OCR — same route. NOTE the identity: OCR's non-calculator papers are 02 and
// 05, not 01, and every J560 paper is 100 marks rather than 80.
import { OCR_J560_01_JUN25 } from './ocr-j560-01-jun25'
import { OCR_J560_02_JUN25 } from './ocr-j560-02-jun25'
import { OCR_J560_03_JUN25 } from './ocr-j560-03-jun25'
import { OCR_J560_04_JUN25 } from './ocr-j560-04-jun25'
import { OCR_J560_05_JUN25 } from './ocr-j560-05-jun25'
import { OCR_J560_06_JUN25 } from './ocr-j560-06-jun25'

// AQA Foundation.
import { AQA_8300_1F_JUN25 } from './aqa-8300-1f-jun25'
import { AQA_8300_2F_JUN25 } from './aqa-8300-2f-jun25'
import { AQA_8300_3F_JUN25 } from './aqa-8300-3f-jun25'
import { AQA_8300_1F_JUN24 } from './aqa-8300-1f-jun24'
import { AQA_8300_2F_JUN24 } from './aqa-8300-2f-jun24'
import { AQA_8300_3F_JUN24 } from './aqa-8300-3f-jun24'
import { AQA_8300_1F_NOV23 } from './aqa-8300-1f-nov23'
import { AQA_8300_2F_NOV23 } from './aqa-8300-2f-nov23'
import { AQA_8300_3F_NOV23 } from './aqa-8300-3f-nov23'
import { AQA_8300_1F_JUN23 } from './aqa-8300-1f-jun23'
import { AQA_8300_2F_JUN23 } from './aqa-8300-2f-jun23'
import { AQA_8300_3F_JUN23 } from './aqa-8300-3f-jun23'

// AQA Higher.
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
 * so this list is NEWEST SERIES FIRST, and Foundation before Higher within a
 * series. A teacher marking an autumn mock reaches for the most recent papers,
 * and scrolling past three years of history to find them is the sort of
 * friction that ends with the tool unused.
 *
 * TWO KINDS OF PAPER LIVE HERE, and the difference shows on a feedback sheet —
 * the split is HAND-AUTHORED vs GENERATED, not tier and not board:
 *
 *   • The three AQA Foundation Nov 2024 papers are HAND-AUTHORED and carry
 *     `retrySet` and `challengeQuestions`, so their sheets include "Practise
 *     these" and "Push yourself". They are also why NOV24-F-P1..3 are NOT
 *     generated from the audit, though the coding exists: regenerating them
 *     would replace a richer paper with a poorer one.
 *
 *   • Everything else is GENERATED from data/exam-audit/, which transcribes no
 *     exam text. Those sheets carry the score, coverage, topic and skill
 *     breakdown and the WWW/EBI prose, and simply omit those two sections
 *     rather than printing empty headings. Filling in either object in a
 *     generated file turns its section back on with no other change.
 *
 * Adding a paper is still "write a file matching PaperConfig, add it here" —
 * for an audited paper the script writes the file for you. The full procedure,
 * including how to code a paper that is not in the audit yet, is in
 * docs/coding-a-paper.md.
 *
 * NOTE FOR THE PAID PATH: recording a sitting also needs anchor rows in the
 * `questions` table, created by scripts/sync-paper-items.ts. Until that has
 * been run for a paper, POST /api/papers/sittings rejects it with "not set up
 * for tracking yet". The FREE tool at /mark needs no anchors — it writes
 * nothing — so a newly added paper works there immediately.
 */
export const PAPERS: Record<string, PaperConfig> = {
  // June 2025
  [EDEXCEL_1MA1_1F_JUN25.id]: EDEXCEL_1MA1_1F_JUN25,
  [EDEXCEL_1MA1_2F_JUN25.id]: EDEXCEL_1MA1_2F_JUN25,
  [EDEXCEL_1MA1_3F_JUN25.id]: EDEXCEL_1MA1_3F_JUN25,
  [EDEXCEL_1MA1_1H_JUN25.id]: EDEXCEL_1MA1_1H_JUN25,
  [EDEXCEL_1MA1_2H_JUN25.id]: EDEXCEL_1MA1_2H_JUN25,
  [EDEXCEL_1MA1_3H_JUN25.id]: EDEXCEL_1MA1_3H_JUN25,
  [OCR_J560_01_JUN25.id]: OCR_J560_01_JUN25,
  [OCR_J560_02_JUN25.id]: OCR_J560_02_JUN25,
  [OCR_J560_03_JUN25.id]: OCR_J560_03_JUN25,
  [OCR_J560_04_JUN25.id]: OCR_J560_04_JUN25,
  [OCR_J560_05_JUN25.id]: OCR_J560_05_JUN25,
  [OCR_J560_06_JUN25.id]: OCR_J560_06_JUN25,
  [AQA_8300_1F_JUN25.id]: AQA_8300_1F_JUN25,
  [AQA_8300_2F_JUN25.id]: AQA_8300_2F_JUN25,
  [AQA_8300_3F_JUN25.id]: AQA_8300_3F_JUN25,
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
  [AQA_8300_1F_JUN24.id]: AQA_8300_1F_JUN24,
  [AQA_8300_2F_JUN24.id]: AQA_8300_2F_JUN24,
  [AQA_8300_3F_JUN24.id]: AQA_8300_3F_JUN24,
  [AQA_8300_1H_JUN24.id]: AQA_8300_1H_JUN24,
  [AQA_8300_2H_JUN24.id]: AQA_8300_2H_JUN24,
  [AQA_8300_3H_JUN24.id]: AQA_8300_3H_JUN24,

  // November 2023
  [AQA_8300_1F_NOV23.id]: AQA_8300_1F_NOV23,
  [AQA_8300_2F_NOV23.id]: AQA_8300_2F_NOV23,
  [AQA_8300_3F_NOV23.id]: AQA_8300_3F_NOV23,
  [AQA_8300_1H_NOV23.id]: AQA_8300_1H_NOV23,
  [AQA_8300_2H_NOV23.id]: AQA_8300_2H_NOV23,
  [AQA_8300_3H_NOV23.id]: AQA_8300_3H_NOV23,

  // June 2023
  [AQA_8300_1F_JUN23.id]: AQA_8300_1F_JUN23,
  [AQA_8300_2F_JUN23.id]: AQA_8300_2F_JUN23,
  [AQA_8300_3F_JUN23.id]: AQA_8300_3F_JUN23,
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
