import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Which skills have something to practise.
//
// The skill list in data/skills.ts is the curriculum, not the question bank: a
// skill can be added before any question for it is published (five were, on
// 2026-09-04). Listing one to a student promises practice the app cannot give,
// so the student-facing lists — /skills, the dashboard's topic map, the
// practice pickers, the teacher's assignment browser — keep only the skills
// with at least one PUBLISHED question.
//
// Read at runtime, not baked in, so publishing a draft makes its skill appear
// with no deploy. Published questions are publicly readable (RLS "questions:
// public read published"), so this works signed in or out.
//
// FAILS OPEN. If the read fails, callers get null and show every skill: a
// student seeing a skill with nothing behind it is a small harm; a skills page
// that is suddenly empty is a large one.
// ─────────────────────────────────────────────────────────────────────────────

/** PostgREST caps a response at 1000 rows by default, so read in pages. */
const PAGE = 1000

type Page = { data: { skill_ids: string[] | null }[] | null; error: unknown }

/** Pages through published questions and collects every skill they cover. */
export async function collectPublishedSkillIds(
  fetchPage: (from: number, to: number) => PromiseLike<Page>,
): Promise<Set<string> | null> {
  const ids = new Set<string>()
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1)
    if (error || !data) return null
    for (const q of data) for (const id of q.skill_ids ?? []) ids.add(id)
    if (data.length < PAGE) return ids
  }
}

let cached: Promise<Set<string> | null> | null = null

/** Skill ids with at least one published question; null if unknown. Cached per page load. */
export function fetchPublishedSkillIds(): Promise<Set<string> | null> {
  cached ??= collectPublishedSkillIds((from, to) =>
    supabase.from('questions').select('skill_ids').eq('is_published', true).range(from, to),
  ).catch(() => null)
  return cached
}

/** The same, as React state: null until it arrives, and null if it fails. */
export function usePublishedSkillIds(): Set<string> | null {
  const [ids, setIds] = useState<Set<string> | null>(null)
  useEffect(() => {
    let live = true
    fetchPublishedSkillIds().then(s => { if (live) setIds(s) })
    return () => { live = false }
  }, [])
  return ids
}

/** True when a skill should be shown: it has a published question, or we do not know. */
export function isPractisable(skillId: string, published: Set<string> | null): boolean {
  return !published || published.has(skillId)
}
