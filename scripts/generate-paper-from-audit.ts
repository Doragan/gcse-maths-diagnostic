import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { skills } from '../data/skills'

// ─────────────────────────────────────────────────────────────────────────────
// Turn a coded exam-audit paper into a PaperConfig the marking tool can use.
//
//   npx tsx scripts/generate-paper-from-audit.ts NOV24-H-P1        # dry run
//   npx tsx scripts/generate-paper-from-audit.ts NOV24-H-P1 --write
//   npx tsx scripts/generate-paper-from-audit.ts --higher --write  # all 15
//
// WHY THIS EXISTS. data/exam-audit/ already holds every question of thirty
// papers coded with its marks, skill ids and kind — which is most of a
// PaperQuestion. The marking tool, meanwhile, knew about three papers, all AQA
// Foundation November 2024. That gap, not the paywall or the UI, is the reason
// a teacher marking a mock this autumn had nothing to pick.
//
// WHAT IT CANNOT DERIVE, and why that is survivable:
//
//   • retrySet — a same-skill practice question per item. Hand-authored, and
//     the audit deliberately transcribes no exam text. A generated paper simply
//     has none, and the feedback sheet omits its "Practise these" section
//     rather than printing an empty heading (see lib/papers/feedbackPdf.ts).
//     Adding them later is editing one object in the generated file.
//
//   • challengeQuestions — same story, and the sheet omits "Push yourself".
//
//   • sampleStudents / sampleMarks — only feed the demo tool's "Load Demo Data"
//     button, which a real paper does not need.
//
// So a generated paper produces a sheet with the score, coverage, topic and
// skill breakdown and the WWW/EBI prose — everything except the two sections
// made of question text nobody has typed in.
//
// THE OUTPUT IS MEANT TO BE EDITED. These are ordinary source files, not build
// artefacts: correct a tagging mistake in place and note it in the file header,
// exactly as the hand-authored papers do. Re-running would overwrite such a
// correction, so the script refuses to clobber an existing file without --force.
//
// ── ADDING A PAPER FROM ANOTHER BOARD (Edexcel, OCR, …) ─────────────────────
//
// FULL PROCEDURE: docs/coding-a-paper.md — how to get the marks out of a PDF,
// which source to trust for them, and how to decide a tagging judgement.
//
// Drop a JSON file into data/exam-audit/ with the shape below. The full audit
// schema has some fifteen fields per row because it also feeds the exam
// COVERAGE analysis; a paper only needs these:
//
//   {
//     "meta": {
//       "paper_slug":     "edexcel-1ma1-1h-jun24",
//       "paper_title":    "Edexcel GCSE Mathematics 1MA1/1H",
//       "paper_subtitle": "Higher Tier Paper 1 Non-calculator — June 2024",
//       "total_marks": 80
//     },
//     "rows": [
//       { "q": "1", "part": null, "marks": 2, "skill_ids": ["indices"], "kind": "mastery",
//         "answer_form": "numeric", "app_gap_note": "single numeric answer" }
//     ]
//   }
//
//   • paper_slug / paper_title / paper_subtitle — REQUIRED together for a
//     non-AQA paper, and the reason is in identify() below: boards number
//     papers and arrange calculator rules differently, and a script that
//     guessed would label a calculator paper "Non-calculator" with complete
//     confidence. Whoever has the paper open states what it is.
//   • q / part / marks — part is null for an unlettered question.
//   • skill_ids — ids from data/skills.ts. VALIDATED: an unknown id is
//     reported, and the topic column comes from the first skill's own topic.
//   • kind — "mastery" or "exam".
//   • answer_form — optional; only "draw*" is used, to set `visual`.
//   • app_gap_note — optional; becomes `desc`, the marking grid's tooltip.
//   • total_marks — optional but worth giving: a mismatch against the summed
//     rows is reported, which is the cheapest way to catch a half-coded paper.
//
// NO EXAM TEXT. The audit is derived metadata by design — question numbers,
// marks and skills are facts about a paper, not a reproduction of it. Keep it
// that way.
// ─────────────────────────────────────────────────────────────────────────────

type AuditRow = {
  q: string | number
  part: string | null
  marks: number
  skill_ids: string[] | null
  kind: 'mastery' | 'exam'
  answer_form?: string
  app_gap_note?: string | null
  /**
   * Topic id, overriding the one the first skill would imply.
   *
   * Exists for the UNTAGGED case. A question the taxonomy has no node for still
   * belongs to a topic, and without this it lands in the fallback — so a kite
   * question would be filed under Probability and Data, which is worse on a
   * feedback sheet than the missing skill it is standing in for.
   */
  topic?: string
}

type AuditMeta = Record<string, unknown>
type Audit = { meta: AuditMeta; rows: AuditRow[] }

const AUDIT_DIR = join(__dirname, '..', 'data', 'exam-audit')
const OUT_DIR = join(__dirname, '..', 'lib', 'demoPapers')

const skillById = new Map(skills.map(s => [s.id, s]))

/**
 * data/skills.ts topic names → the ids lib/demoTopicColours.ts colours by.
 *
 * The PaperTopic LABEL must be a name topicColourFor recognises or the column
 * silently falls back to slate, so the labels below are the skill graph's own
 * strings rather than anything invented here.
 */
const TOPIC_BY_SKILL_TOPIC: Record<string, { id: string; label: string }> = {
  'Number': { id: 'number', label: 'Number' },
  'Algebra': { id: 'algebra', label: 'Algebra' },
  'Ratio and Proportion': { id: 'ratio', label: 'Ratio and Proportion' },
  'Shape and Space': { id: 'shape', label: 'Shape and Space' },
  'Probability and Data': { id: 'probdata', label: 'Probability and Data' },
}

/** The same topics, addressable by id for a row's explicit `topic` override. */
const TOPIC_BY_ID: Record<string, { id: string; label: string }> =
  Object.fromEntries(Object.values(TOPIC_BY_SKILL_TOPIC).map(t => [t.id, t]))

/**
 * Where an item with no skill tag and no explicit topic lands.
 *
 * A last resort, and reported loudly: an untagged item should say which topic
 * it belongs to rather than accept this.
 */
const UNTAGGED_TOPIC = { id: 'probdata', label: 'Probability and Data' }

const SERIES_NAMES: Record<string, string> = {
  JUN: 'June', NOV: 'November',
}

/** "edexcel-1ma1-1h-jun24" → "EDEXCEL_1MA1_1H_JUN24". */
function constNameFor(slug: string): string {
  return slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

/**
 * Everything identifying a paper.
 *
 * EXPLICIT IDENTITY WINS. A file may state `paper_slug`, `paper_title` and
 * `paper_subtitle` in its meta, and then this script needs to know nothing
 * about the board it came from. That is the ONLY supported route for a
 * non-AQA paper, deliberately: every board numbers its papers differently and
 * arranges its calculator rules differently, and a script that guessed those
 * would put "Non-calculator" on a calculator paper with total confidence. The
 * person reading the paper states what it is.
 *
 * Otherwise it falls back to inferring an AQA 8300 paper from the FILENAME, as
 * the thirty audit files are named (NOV24-H-P1). Their `meta` blocks are not
 * consistent enough to rely on — across the fifteen Higher papers `paper`
 * appears as "1", as 1, and as "Paper 1 (Non-calculator)", and the calculator
 * flag as "non_calc", "calc", true and false — but the filename has said the
 * same thing the same way in every file since the audit began.
 */
function identify(auditId: string, meta: AuditMeta) {
  const slug = typeof meta.paper_slug === 'string' ? meta.paper_slug : null
  const title = typeof meta.paper_title === 'string' ? meta.paper_title : null
  const subtitle = typeof meta.paper_subtitle === 'string' ? meta.paper_subtitle : null

  if (slug || title || subtitle) {
    if (!slug || !title || !subtitle) {
      throw new Error(
        `${auditId}: paper_slug, paper_title and paper_subtitle must be given together ` +
        `(got ${[slug && 'slug', title && 'title', subtitle && 'subtitle'].filter(Boolean).join(', ') || 'none'}). ` +
        `A half-identified paper would be filed under a name nobody chose.`,
      )
    }
    return { auditId, slug, constName: constNameFor(slug), title, subtitle }
  }

  const m = /^([A-Z]{3})(\d{2})-([HF])-P(\d)$/.exec(auditId)
  if (!m) {
    throw new Error(
      `"${auditId}" is not an AQA audit filename (e.g. NOV24-H-P1), so it must state ` +
      `paper_slug, paper_title and paper_subtitle in its meta block.`,
    )
  }
  const [, monthCode, yy, tierCode, paperNo] = m
  const tier = tierCode === 'H' ? 'Higher' : 'Foundation'
  // AQA 8300 only: paper 1 is non-calculator, papers 2 and 3 allow one. This
  // is why other boards must identify themselves rather than be inferred.
  const calc = paperNo === '1' ? 'Non-calculator' : 'Calculator'
  const seriesSlug = `${monthCode.toLowerCase()}${yy}`
  return {
    auditId,
    slug: `aqa-8300-${paperNo}${tierCode.toLowerCase()}-${seriesSlug}`,
    constName: `AQA_8300_${paperNo}${tierCode}_${seriesSlug.toUpperCase()}`,
    title: `AQA GCSE Mathematics 8300/${paperNo}${tierCode}`,
    subtitle: `${tier} Tier Paper ${paperNo} ${calc} — ${SERIES_NAMES[monthCode] ?? monthCode} 20${yy}`,
  }
}

/** "1" + null → id "1"; "2" + "a" → id "2a", label "2(a)". */
function itemIds(row: AuditRow) {
  const q = String(row.q)
  const part = row.part ?? ''
  return { id: `${q}${part}`, label: part ? `${q}(${part})` : q }
}

/** Single-quoted TS string literal, escaped. */
function q(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

type Warning = string

function build(auditId: string): { source: string; slug: string; constName: string; warnings: Warning[] } {
  const file = join(AUDIT_DIR, `${auditId}.json`)
  if (!existsSync(file)) throw new Error(`No audit file at ${file}`)
  const audit: Audit = JSON.parse(readFileSync(file, 'utf8'))
  const id = identify(auditId, audit.meta)
  const warnings: Warning[] = []

  const seen = new Set<string>()
  const topicsUsed = new Map<string, string>()

  const questions = audit.rows.map(row => {
    const { id: itemId, label } = itemIds(row)
    if (seen.has(itemId)) warnings.push(`duplicate item id "${itemId}" — the second overwrites the first`)
    seen.add(itemId)

    const skillIds = Array.isArray(row.skill_ids) ? row.skill_ids : []
    const unknown = skillIds.filter(s => !skillById.has(s))
    if (unknown.length) warnings.push(`item ${label}: unknown skill id(s) ${unknown.join(', ')}`)

    // Topic comes from the FIRST skill: a multi-skill item can straddle two
    // topics and the mark scheme gives no way to split it, so the primary skill
    // decides which column the question sits in. An explicit `topic` overrides
    // that, which is how an untagged item still lands in the right column.
    let explicitTopic: { id: string; label: string } | undefined
    if (typeof row.topic === 'string') {
      explicitTopic = TOPIC_BY_ID[row.topic]
      if (!explicitTopic) {
        warnings.push(
          `item ${label}: unknown topic "${row.topic}" — expected one of ${Object.keys(TOPIC_BY_ID).join(', ')}`,
        )
      }
    }
    const primary = skillIds.map(s => skillById.get(s)).find(Boolean)
    const topic = explicitTopic
      ?? (primary ? TOPIC_BY_SKILL_TOPIC[primary.topic] ?? UNTAGGED_TOPIC : UNTAGGED_TOPIC)

    if (!primary) {
      warnings.push(
        explicitTopic
          // Deliberate: the taxonomy has no node for this question, and the
          // topic was stated so the marks still land in the right column.
          ? `item ${label} is untagged by design — filed under ${topic.label}, contributing ` +
            `${row.marks} mark(s) with no skill evidence. Check coding_notes says why.`
          : `item ${label} has no skill tag AND no topic — falling back to ${topic.label}, which is ` +
            `probably wrong. Give it a "topic" even if the taxonomy has no skill for it.`,
      )
    }
    topicsUsed.set(topic.id, topic.label)

    // The audit transcribes no exam text (deliberately — it is a derived-data
    // set). `app_gap_note` describes what the question asks for, which is the
    // closest thing available to the hand-authored papers' `desc`.
    const desc = (row.app_gap_note ?? '').trim()

    return {
      id: itemId,
      label,
      marks: row.marks,
      topic: topic.id,
      skill: skillIds.map(s => skillById.get(s)?.name ?? s).join(' + ') || 'Untagged',
      skillIds,
      kind: row.kind,
      desc,
      // Only a drawing answer genuinely cannot be reissued as text.
      visual: (row.answer_form ?? '').startsWith('draw'),
    }
  })

  const declared = (audit.meta.total_marks ?? audit.meta.max_marks) as number | undefined
  const sum = questions.reduce((a, x) => a + x.marks, 0)
  if (declared != null && sum !== declared) {
    warnings.push(`marks sum to ${sum} but the audit declares ${declared}`)
  }

  // Topics in the palette's own order, so every paper's columns run the same way.
  const order = ['number', 'algebra', 'ratio', 'shape', 'probdata']
  const topics = order
    .filter(t => topicsUsed.has(t))
    .map(t => ({ id: t, label: topicsUsed.get(t)! }))

  const w = {
    id: Math.max(...questions.map(x => q(x.id).length)),
    label: Math.max(...questions.map(x => q(x.label).length)),
    topic: Math.max(...questions.map(x => q(x.topic).length)),
    skill: Math.max(...questions.map(x => q(x.skill).length)),
  }

  const lines = questions.map(x =>
    `    { id: ${pad(q(x.id) + ',', w.id + 1)} label: ${pad(q(x.label) + ',', w.label + 1)}` +
    ` marks: ${pad(String(x.marks) + ',', 3)} topic: ${pad(q(x.topic) + ',', w.topic + 1)}` +
    ` skill: ${pad(q(x.skill) + ',', w.skill + 1)} skillIds: [${x.skillIds.map(q).join(', ')}],` +
    ` kind: ${q(x.kind)}, visual: ${x.visual}, desc: ${q(x.desc)} },`,
  )

  const source = `import type { PaperConfig } from './types'

/**
 * ${id.title} — ${id.subtitle}.
 *
 * GENERATED from data/exam-audit/${auditId}.json by
 * scripts/generate-paper-from-audit.ts. Regenerating overwrites this file, so
 * a hand correction should be noted here — the script refuses to overwrite
 * without --force precisely so corrections are not lost silently.
 *
 * WHAT IS DELIBERATELY ABSENT: \`retrySet\` and \`challengeQuestions\` are
 * hand-authored from question text, and the audit transcribes none. A feedback
 * sheet from this paper therefore omits its "Practise these" and "Push
 * yourself" sections and carries everything else — score, coverage, topic and
 * skill breakdown, and the WWW/EBI prose. Fill either object in to turn those
 * sections back on; nothing else needs to change.
 *
 * \`desc\` is the audit's own note about what each question asks for, not the
 * question text.
${warnings.length ? ` *
 * KNOWN GAPS in this paper, carried here so they survive regeneration:
${warnings.map(w => ` *   • ${w}`).join('\n')}
 */` : ' */'}
export const ${id.constName}: PaperConfig = {
  id: ${q(id.slug)},
  title: ${q(id.title)},
  subtitle: ${q(id.subtitle)},

  topics: [
${topics.map(t => `    { id: ${q(t.id)}, label: ${q(t.label)} },`).join('\n')}
  ],

  questions: [
${lines.join('\n')}
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
`

  return { source, slug: id.slug, constName: id.constName, warnings }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const write = args.includes('--write')
const force = args.includes('--force')
const allHigher = args.includes('--higher')

let ids = args.filter(a => !a.startsWith('--'))
if (allHigher) {
  ids = ['JUN23', 'NOV23', 'JUN24', 'NOV24', 'JUN25']
    .flatMap(s => [1, 2, 3].map(p => `${s}-H-P${p}`))
    .filter(a => existsSync(join(AUDIT_DIR, `${a}.json`)))
}
if (!ids.length) {
  console.error('Usage: generate-paper-from-audit.ts <AUDIT-ID>... [--higher] [--write] [--force]')
  process.exit(1)
}

const registry: { slug: string; constName: string; file: string }[] = []
let problems = 0

for (const auditId of ids) {
  const { source, slug, constName, warnings } = build(auditId)
  const out = join(OUT_DIR, `${slug}.ts`)
  const exists = existsSync(out)

  for (const warn of warnings) {
    problems++
    console.warn(`  ! ${auditId}: ${warn}`)
  }

  if (!write) {
    console.log(`${auditId} → ${slug}.ts (${source.split('\n').length} lines)${exists ? ' [EXISTS]' : ''}`)
  } else if (exists && !force) {
    console.warn(`  SKIPPED ${slug}.ts — already exists. Re-run with --force to overwrite.`)
  } else {
    writeFileSync(out, source, 'utf8')
    console.log(`  wrote lib/demoPapers/${slug}.ts`)
  }
  registry.push({ slug, constName, file: `./${slug}` })
}

console.log(`\n${problems} warning(s).`)
if (!write) console.log('Dry run — nothing written. Add --write.')

console.log('\nRegistry lines for lib/demoPapers/index.ts:\n')
for (const r of registry) console.log(`import { ${r.constName} } from '${r.file}'`)
console.log()
for (const r of registry) console.log(`  [${r.constName}.id]: ${r.constName},`)
