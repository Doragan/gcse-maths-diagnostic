import type { PaperConfig } from './types'
import { AQA_8300_1F_NOV24 } from './aqa-8300-1f-nov24'
import { AQA_8300_2F_NOV24 } from './aqa-8300-2f-nov24'
import { AQA_8300_3F_NOV24 } from './aqa-8300-3f-nov24'

export type { PaperConfig, PaperTopic, PaperQuestion, PaperRetryQuestion, PaperChallengeQuestion } from './types'

/**
 * Every paper the marking tool knows about, keyed by id.
 *
 * This registry exists so that adding a paper is "write a new file matching
 * PaperConfig, add it here" — no other file needs to change, including the
 * marking page itself. There is no paper-picker UI yet (the marking page
 * always loads one specific import); this is the seam a future one would
 * read from.
 */
export const PAPERS: Record<string, PaperConfig> = {
  [AQA_8300_1F_NOV24.id]: AQA_8300_1F_NOV24,
  [AQA_8300_2F_NOV24.id]: AQA_8300_2F_NOV24,
  [AQA_8300_3F_NOV24.id]: AQA_8300_3F_NOV24,
}

export const DEFAULT_PAPER_ID = AQA_8300_3F_NOV24.id
