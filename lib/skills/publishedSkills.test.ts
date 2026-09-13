import { describe, expect, it, vi } from 'vitest'

// The module imports the app's Supabase client, which throws without env vars.
// The functions under test never touch it.
vi.mock('../supabase', () => ({ supabase: {} }))

import { collectPublishedSkillIds, isPractisable } from './publishedSkills'

const row = (...ids: string[]) => ({ skill_ids: ids })

describe('collectPublishedSkillIds', () => {
  it('collects every skill a published question covers, once', async () => {
    const ids = await collectPublishedSkillIds(async () => ({ data: [row('ratio', 'proportion'), row('ratio'), row()], error: null }))
    expect([...ids!].sort()).toEqual(['proportion', 'ratio'])
  })

  it('reads past the 1000-row page cap', async () => {
    // A bank bigger than one page must not stop at the first 1000, or skills
    // whose questions come back late would vanish from every list.
    const calls: number[] = []
    const ids = await collectPublishedSkillIds(async from => {
      calls.push(from)
      if (from === 0) return { data: Array.from({ length: 1000 }, () => row('ratio')), error: null }
      return { data: [row('surds')], error: null }
    })
    expect(calls).toEqual([0, 1000])
    expect(ids!.has('surds')).toBe(true)
  })

  it('tolerates a question with no skill ids', async () => {
    const ids = await collectPublishedSkillIds(async () => ({ data: [{ skill_ids: null }], error: null }))
    expect(ids!.size).toBe(0)
  })

  it('returns null when the read fails, so callers fail open', async () => {
    expect(await collectPublishedSkillIds(async () => ({ data: null, error: { message: 'down' } }))).toBeNull()
  })
})

describe('isPractisable', () => {
  it('keeps a skill with a published question and drops one without', () => {
    const published = new Set(['ratio'])
    expect(isPractisable('ratio', published)).toBe(true)
    expect(isPractisable('exponential_graphs', published)).toBe(false)
  })

  it('keeps everything while the set is unknown', () => {
    expect(isPractisable('exponential_graphs', null)).toBe(true)
  })
})
