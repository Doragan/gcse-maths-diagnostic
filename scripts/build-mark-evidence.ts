/**
 * Regenerate lib/exam/markEvidence.data.ts from data/exam-audit/.
 *
 * The audit JSON (12 papers, 444 rows, many fields) is far too heavy to ship to
 * the browser, and the exam assembler runs client-side. So we precompute the
 * only thing the app needs — marks-per-part statistics keyed by skill+kind and
 * by kind — into a small committed module, exactly as data/skills.ts keeps the
 * skill graph in code.
 *
 * Re-run this whenever a new paper series is coded:
 *   npx tsx scripts/build-mark-evidence.ts
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const AUDIT_DIR = join(process.cwd(), 'data', 'exam-audit')
const OUT = join(process.cwd(), 'lib', 'exam', 'markEvidence.data.ts')

type Row = { marks: number; skill_ids: string[] | null; kind: string | null; mark_split: string | null }
type Bucket = { marks: number[]; splits: Record<string, number> }

/**
 * Method marks in one part's mark scheme, from its `mark_split` code.
 *
 * AQA schemes read like "M1 A1" or "M2 A1 ft": an M code is a METHOD mark,
 * awarded for a correct approach even when the final answer is wrong. That is
 * precisely the credit auto-grading cannot see, so counting M is how we size the
 * blind spot. B and A codes are answer marks and need the answer to be right.
 *
 * Capped at the part's total — a handful of schemes list alternative routes
 * (e.g. "M1 A1 OR M2"), which would otherwise sum past the marks available.
 */
function methodMarksOf(row: Row): number {
  const m = [...(row.mark_split ?? '').matchAll(/\bM(\d)\b/g)]
    .reduce((s, x) => s + Number(x[1]), 0)
  return Math.min(m, row.marks)
}

function stats(b: Bucket) {
  const m = b.marks
  const mean = m.reduce((s, v) => s + v, 0) / m.length
  const splits = Object.entries(b.splits).sort((a, b2) => b2[1] - a[1]).slice(0, 2).map(([s]) => s)
  return {
    n: m.length,
    mean: Math.round(mean * 100) / 100,
    min: Math.min(...m),
    max: Math.max(...m),
    splits,
  }
}

function main() {
  const files = readdirSync(AUDIT_DIR).filter(f => f.endsWith('.json')).sort()
  const rows: Row[] = []
  const skippedByFile: Record<string, number> = {}
  for (const f of files) {
    const j = JSON.parse(readFileSync(join(AUDIT_DIR, f), 'utf8'))
    // ONLY rows that actually carry a mark_split.
    //
    // Every statistic below is about the M/A/B split of a mark scheme, and a
    // row without one has NOT RECORDED that — it has not recorded "no method
    // marks". Counting it as zero is the difference between a fact and an
    // absence, and it silently halved every rate here when twelve Edexcel and
    // OCR papers were coded without the field: the 5-mark method share fell
    // from 2.09 to 0.91 and a spurious "6 marks -> 0" bucket appeared.
    //
    // Papers coded without it are simply not evidence about mark schemes. They
    // still feed the paper registry and the coverage analysis, which do not
    // read this field.
    const kept = (j.rows as Row[]).filter(r => r.mark_split)
    const skipped = (j.rows as Row[]).length - kept.length
    if (skipped) skippedByFile[f.replace('.json', '')] = skipped
    rows.push(...kept)
  }

  const skippedTotal = Object.values(skippedByFile).reduce((a, b) => a + b, 0)
  if (skippedTotal) {
    console.log(
      `skipped ${skippedTotal} parts with no mark_split, across ` +
      `${Object.keys(skippedByFile).length} papers (not evidence about mark schemes)`)
  }

  const bySkillKind: Record<string, Bucket> = {}
  const byKind: Record<string, Bucket> = {}
  const add = (map: Record<string, Bucket>, key: string, r: Row) => {
    const b = (map[key] ??= { marks: [], splits: {} })
    b.marks.push(r.marks)
    if (r.mark_split) b.splits[r.mark_split] = (b.splits[r.mark_split] ?? 0) + 1
  }

  for (const r of rows) {
    if (!Number.isFinite(r.marks)) continue
    const kind = r.kind === 'exam' ? 'exam' : 'mastery'
    add(byKind, kind, r)
    // A multi-skill part attributes its FULL marks to each tagged skill — the
    // same convention the mastery engine uses for crediting skills, and the one
    // the scoping analysis measured. It slightly over-weights multi-skill parts
    // per skill, which is acceptable for an estimate of "what is this worth".
    for (const s of r.skill_ids ?? []) add(bySkillKind, `${s}|${kind}`, r)
  }

  const skillKindOut = Object.fromEntries(
    Object.entries(bySkillKind).map(([k, b]) => [k, stats(b)]).sort((a, b) => a[0] < b[0] ? -1 : 1),
  )
  const kindOut = Object.fromEntries(Object.entries(byKind).map(([k, b]) => [k, stats(b)]))

  const overall = stats({ marks: rows.map(r => r.marks), splits: {} })

  // Method marks by part size. Deliberately conditioned on SIZE alone: the
  // scoping analysis found mark_split is a property of the method chain rather
  // than the topic, and how many steps a part has is exactly what its mark total
  // encodes. Averaged over ALL parts of that size, including the many that carry
  // no method marks at all, so it is an expectation and not a ceiling.
  const bySize: Record<number, { parts: number; method: number }> = {}
  for (const r of rows) {
    if (!Number.isFinite(r.marks)) continue
    const b = (bySize[r.marks] ??= { parts: 0, method: 0 })
    b.parts++
    b.method += methodMarksOf(r)
  }
  const methodShare = Object.fromEntries(
    Object.entries(bySize)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([size, b]) => [size, Math.round((b.method / b.parts) * 100) / 100]),
  )

  const body = `// GENERATED by scripts/build-mark-evidence.ts — do not edit by hand.
// Source: data/exam-audit/ (${files.length} papers, ${rows.length} parts,
// ${rows.reduce((s, r) => s + r.marks, 0)} marks). Re-run the script after coding
// a new paper series.

export type MarkStats = { n: number; mean: number; min: number; max: number; splits: string[] }

/** Marks per part for real exam parts, keyed \`\${skillId}|\${kind}\`. */
export const BY_SKILL_KIND: Record<string, MarkStats> = ${JSON.stringify(skillKindOut, null, 1)}

/** Fallback when a skill has too little evidence of its own. */
export const BY_KIND: Record<string, MarkStats> = ${JSON.stringify(kindOut, null, 1)}

/** Last-resort centre: every coded part, regardless of skill or kind. */
export const OVERALL: MarkStats = ${JSON.stringify(overall, null, 1)}

/**
 * Average METHOD marks per part, by the part's mark total.
 *
 * Method marks are what a real scheme awards for a sound approach behind a wrong
 * answer — the credit auto-grading is blind to. Note the 1-mark row: a one-mark
 * part never carries method marks, which is what makes the blind spot bounded.
 */
export const METHOD_SHARE_BY_MARKS: Record<number, number> = ${JSON.stringify(methodShare, null, 1)}
`
  writeFileSync(OUT, body)

  console.log(`${files.length} papers, ${rows.length} parts → ${OUT}`)
  console.log(`overall: mean ${overall.mean}, range ${overall.min}-${overall.max}`)
  for (const [k, v] of Object.entries(kindOut)) console.log(`  ${k}: n=${(v as { n: number }).n} mean=${(v as { mean: number }).mean}`)
  const ns = Object.values(skillKindOut).map(v => (v as { n: number }).n)
  console.log(`skill+kind buckets: ${ns.length} (n>=4: ${ns.filter(n => n >= 4).length}, n>=2: ${ns.filter(n => n >= 2).length})`)
}

main()
