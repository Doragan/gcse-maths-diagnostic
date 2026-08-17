import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// Tier 3 generator — turns the coded exam audit into a per-skill exam profile.
//
//   npx tsx scripts/build-skill-exam-profiles.ts            regenerate
//   npx tsx scripts/build-skill-exam-profiles.ts --diff     regenerate + report what moved
//
// Everything the skill page claims about how a skill appears on the paper is
// COMPUTED here, never authored. That is the whole point: when a new series is
// coded, the prose on the page moves on its own rather than going quietly stale.
//
// The profile is sliced by BOARD × TIER, because those are the two things a
// student actually sits. A Foundation candidate should never be shown a claim
// derived from Higher papers, and an Edexcel candidate should never be shown a
// claim derived from AQA ones.
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_DIR = join(process.cwd(), 'data', 'exam-audit')
const OUT_FILE  = join(process.cwd(), 'data', 'skillExamProfiles.json')

/**
 * Minimum coded parts before a profile is allowed to make a claim. Below this
 * the percentages are noise — one question swings a band by 25 points. Profiles
 * under the bar are still emitted (so the coverage gap is visible and
 * measurable) but carry `sufficient: false` and the page must not render them.
 */
const MIN_PARTS = 4

type AuditRow = {
  q: string
  part: string | null
  marks: number
  skill_ids: string[]
  answer_form: string
  framing: string[]
  calc: string
  mark_split: string | null
  traps: string[]
}

type AuditPaper = {
  paper_id: string
  meta: {
    board: string
    spec?: string
    tier: string
    paper: string
    series: string
    calc: string
    total_marks: number
  }
  rows: AuditRow[]
}

/** How often a skill is asked plainly, as words. Bands, not authored prose. */
export type BareBand = 'never' | 'rarely' | 'sometimes' | 'usually' | 'almost always'

function bareBand(pct: number): BareBand {
  if (pct === 0)  return 'never'
  if (pct < 15)   return 'rarely'
  if (pct < 50)   return 'sometimes'
  if (pct < 85)   return 'usually'
  return 'almost always'
}

export type SkillExamProfile = {
  skillId: string
  board: string
  tier: string
  /** Coded question parts involving this skill. */
  parts: number
  /**
   * Marks on questions INVOLVING this skill. A part tagged with two skills
   * contributes its full marks to both, so these do not sum to the paper total.
   * Labelled accordingly wherever it is displayed.
   */
  marks: number
  papersSeen: number
  papersTotal: number
  markRange: [number, number]
  framing: Record<string, number>
  barePct: number
  bareBand: BareBand
  calc: Record<string, number>
  /** Distinct mark-split patterns, most informative first. */
  markSplits: string[]
  /** Share of parts whose mark scheme chains (contains a dependent mark). */
  chainedPct: number
  traps: string[]
  /** False when below MIN_PARTS — the page must not render a claim from this. */
  sufficient: boolean
}

export type ProfileManifest = {
  generatedAt: string
  minParts: number
  /** Which papers each board × tier slice was built from. */
  slices: {
    board: string
    tier: string
    papers: string[]
    series: string[]
    skillsPresent: number
    skillsSufficient: number
  }[]
  profiles: Record<string, SkillExamProfile>  // key: `${board}|${tier}|${skillId}`
}

export const profileKey = (board: string, tier: string, skillId: string) =>
  `${board}|${tier}|${skillId}`

/**
 * The coded papers use two different META schemas — they were coded in separate
 * passes. The ROW schema is identical across both (same fields, same vocab), so
 * every count below is unaffected; it is only provenance that diverges:
 *
 *   schema A   spec: "8300"                    series: "June 2024"   total_marks
 *   schema B   qualification: "GCSE … (8300)"  session: "June 2024"  max_marks
 *
 * Normalise on read rather than editing the source files, so re-coding a paper
 * in either shape stays valid. Adding a second exam board makes divergence like
 * this a certainty rather than an accident, so this is the place to absorb it.
 */
function normaliseMeta(raw: Record<string, unknown>, paperId: string): AuditPaper['meta'] {
  const spec = (raw.spec as string)
    ?? (typeof raw.qualification === 'string'
        ? (raw.qualification.match(/\b(\d{4})\b/)?.[1] ?? raw.qualification)
        : undefined)
  const series = (raw.series as string) ?? (raw.session as string)
  const totalMarks = (raw.total_marks as number) ?? (raw.max_marks as number)
  // `calc` is a paper-level convenience only; the per-row `calc` field is
  // authoritative and present in both schemas.
  const calc = (raw.calc as string)
    ?? (raw.calculator === false ? 'non_calc' : raw.calculator === true ? 'calc' : 'unknown')

  const missing = [
    !raw.board && 'board', !spec && 'spec', !raw.tier && 'tier',
    !series && 'series', !totalMarks && 'total_marks',
  ].filter(Boolean)
  if (missing.length) console.warn(`  ! ${paperId}: unresolved meta [${missing.join(', ')}]`)

  return {
    board: raw.board as string,
    spec,
    tier: raw.tier as string,
    paper: String(raw.paper),
    series,
    calc,
    total_marks: totalMarks,
  }
}

function loadPapers(): AuditPaper[] {
  return readdirSync(AUDIT_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const raw = JSON.parse(readFileSync(join(AUDIT_DIR, f), 'utf8'))
      return {
        paper_id: raw.paper_id,
        meta: normaliseMeta(raw.meta, raw.paper_id),
        rows: raw.rows,
      } as AuditPaper
    })
}

function build(): ProfileManifest {
  const papers = loadPapers()
  const profiles: Record<string, SkillExamProfile> = {}
  const slices: ProfileManifest['slices'] = []

  // Every (board, tier) pair present in the coded data.
  const sliceKeys = [...new Set(papers.map(p => `${p.meta.board}|${p.meta.tier}`))]

  for (const key of sliceKeys) {
    const [board, tier] = key.split('|')
    const inSlice = papers.filter(p => p.meta.board === board && p.meta.tier === tier)

    type Acc = {
      parts: number; marks: number; papers: Set<string>
      markMin: number; markMax: number
      framing: Record<string, number>; calc: Record<string, number>
      splits: Set<string>; chained: number; traps: Set<string>
    }
    const acc: Record<string, Acc> = {}

    for (const paper of inSlice) {
      for (const row of paper.rows) {
        for (const skillId of row.skill_ids ?? []) {
          const a = (acc[skillId] ??= {
            parts: 0, marks: 0, papers: new Set(),
            markMin: Infinity, markMax: 0,
            framing: {}, calc: {}, splits: new Set(), chained: 0, traps: new Set(),
          })
          a.parts++
          a.marks += row.marks ?? 0
          a.papers.add(paper.paper_id)
          a.markMin = Math.min(a.markMin, row.marks ?? 0)
          a.markMax = Math.max(a.markMax, row.marks ?? 0)
          for (const f of row.framing ?? []) a.framing[f] = (a.framing[f] ?? 0) + 1
          a.calc[row.calc] = (a.calc[row.calc] ?? 0) + 1
          if (row.mark_split) {
            a.splits.add(row.mark_split)
            // 'dep' marks the mark scheme as chained: a wrong earlier step
            // blocks credit on later ones. Worth telling the student.
            if (/dep/i.test(row.mark_split)) a.chained++
          }
          for (const t of row.traps ?? []) a.traps.add(t)
        }
      }
    }

    let sufficient = 0
    for (const [skillId, a] of Object.entries(acc)) {
      const framingTotal = Object.values(a.framing).reduce((s, n) => s + n, 0)
      const barePct = framingTotal ? (100 * (a.framing.bare ?? 0)) / framingTotal : 0
      const ok = a.parts >= MIN_PARTS
      if (ok) sufficient++

      profiles[profileKey(board, tier, skillId)] = {
        skillId, board, tier,
        parts: a.parts,
        marks: a.marks,
        papersSeen: a.papers.size,
        papersTotal: inSlice.length,
        markRange: [a.markMin === Infinity ? 0 : a.markMin, a.markMax],
        framing: a.framing,
        barePct: Math.round(barePct),
        bareBand: bareBand(barePct),
        calc: a.calc,
        // Chained splits first — they carry the most useful warning.
        markSplits: [...a.splits].sort((x, y) => Number(/dep/i.test(y)) - Number(/dep/i.test(x))).slice(0, 4),
        chainedPct: a.parts ? Math.round((100 * a.chained) / a.parts) : 0,
        traps: [...a.traps],
        sufficient: ok,
      }
    }

    slices.push({
      board, tier,
      papers: inSlice.map(p => p.paper_id).sort(),
      series: [...new Set(inSlice.map(p => p.meta.series))].sort(),
      skillsPresent: Object.keys(acc).length,
      skillsSufficient: sufficient,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    minParts: MIN_PARTS,
    slices: slices.sort((a, b) => (a.board + a.tier).localeCompare(b.board + b.tier)),
    profiles,
  }
}

/**
 * What moved since the last generation. This is the guard against silent rot:
 * when a new series shifts a skill's band, any hand-authored guide line that
 * asserted the old band has to be re-read.
 */
function diff(prev: ProfileManifest, next: ProfileManifest): string[] {
  const out: string[] = []
  const keys = [...new Set([...Object.keys(prev.profiles), ...Object.keys(next.profiles)])].sort()

  for (const k of keys) {
    const a = prev.profiles[k], b = next.profiles[k]
    if (!a) { out.push(`+ NEW      ${k} (${b.parts} parts)`); continue }
    if (!b) { out.push(`- DROPPED  ${k}`); continue }
    if (a.bareBand !== b.bareBand)
      out.push(`~ BAND     ${k}: asked plainly "${a.bareBand}" -> "${b.bareBand}"  (${a.barePct}% -> ${b.barePct}%)  ** re-read any guide asserting this **`)
    if (a.sufficient !== b.sufficient)
      out.push(`~ EVIDENCE ${k}: ${a.sufficient ? 'now BELOW' : 'now CLEARS'} the ${next.minParts}-part bar (${a.parts} -> ${b.parts})`)
  }
  return out
}

// ── main ─────────────────────────────────────────────────────────────────────
const wantDiff = process.argv.includes('--diff')

let previous: ProfileManifest | null = null
if (wantDiff) {
  try { previous = JSON.parse(readFileSync(OUT_FILE, 'utf8')) as ProfileManifest }
  catch { console.log('No previous profile file — nothing to diff against.\n') }
}

console.log('Reading coded papers…')
const manifest = build()

console.log('\nSlices built:')
for (const s of manifest.slices) {
  console.log(
    `  ${s.board} ${s.tier.padEnd(11)} ${String(s.papers.length).padStart(2)} papers  ` +
    `${String(s.skillsSufficient).padStart(3)}/${String(s.skillsPresent).padEnd(3)} skills clear the ${manifest.minParts}-part bar  ` +
    `[${s.series.join(', ')}]`
  )
}

if (wantDiff && previous) {
  const changes = diff(previous, manifest)
  console.log('\nChanges since last generation:')
  if (!changes.length) console.log('  (none)')
  else changes.forEach(c => console.log('  ' + c))
}

writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n')
console.log(`\nWrote ${Object.keys(manifest.profiles).length} profiles -> data/skillExamProfiles.json`)
