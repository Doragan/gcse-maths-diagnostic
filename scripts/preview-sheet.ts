/**
 * Print a feedback sheet for an invented student, without a browser or a PDF.
 *
 *   npx tsx scripts/preview-sheet.ts aqa-8300-1f-nov24
 *   npx tsx scripts/preview-sheet.ts aqa-8300-1f-nov24 --weak
 *
 * WHY THIS EXISTS. Tests pass on a paper whose retry questions are subtly
 * wrong — a question that quietly refers to a diagram, a rewrite that dropped
 * the framing, an answer that does not match its question. None of that is
 * structural, so nothing catches it; reading three real sheets does.
 *
 * It also shows the two things a teacher sees that the data does not obviously
 * predict: WHICH practice questions survive the MAX_PRACTICE cap (worst first,
 * by marks lost), and what lands on the answer key.
 *
 * Read-only. Touches no database and writes nothing.
 */
import { PAPERS } from '../lib/demoPapers/index'
import { buildClassEvidence } from '../lib/papers/feedbackEvidence'
import { toWwwEbiSheets, answerKeyFor } from '../lib/papers/wwwEbi'
import type { PaperConfig } from '../lib/demoPapers/types'
import type { ItemMarks } from '../lib/papers/sittingMarks'

/**
 * Three students, so all three shapes of sheet get looked at.
 *
 * Deterministic rather than random: a preview you cannot reproduce is no use
 * for comparing before and after an edit.
 */
const PROFILES: Record<string, (q: PaperConfig['questions'][number], i: number) => number> = {
  // Drops most things — trips the most practice questions, so it is the one
  // that exercises the retry set hardest.
  weak: (q, i) => (i % 4 === 0 ? q.marks : 0),
  // Mixed, which is what most sheets actually look like.
  middling: (q, i) => (i % 3 === 0 ? 0 : q.marks),
  // Near-perfect, the only profile that reaches "Push yourself".
  strong: (q, i) => (i % 9 === 0 ? Math.max(0, q.marks - 1) : q.marks),
}

function marksFor(paper: PaperConfig, profile: string): ItemMarks {
  const f = PROFILES[profile]
  return Object.fromEntries(paper.questions.map((q, i) => [q.id, f(q, i)]))
}

function main() {
  const args = process.argv.slice(2)
  const slug = args.find(a => !a.startsWith('--'))
  const wanted = args.filter(a => a.startsWith('--')).map(a => a.slice(2))
  const profiles = wanted.length ? wanted : Object.keys(PROFILES)

  if (!slug || !PAPERS[slug]) {
    console.error(`Usage: npx tsx scripts/preview-sheet.ts <slug> [--weak] [--middling] [--strong]\n`)
    console.error('Papers:')
    for (const id of Object.keys(PAPERS)) console.error(`  ${id}`)
    process.exit(1)
  }

  const paper = PAPERS[slug]
  const retries = Object.keys(paper.retrySet).length
  const nonVisual = paper.questions.filter(q => !q.visual).length

  console.log(`${paper.title}`)
  console.log(`${paper.subtitle}`)
  console.log(`${paper.questions.length} questions, ${nonVisual} non-visual, ${retries} retry questions\n`)

  if (!retries) {
    console.log('This paper has NO retrySet, so no sheet will show "Practise these".')
    console.log('That is the documented state for a generated paper — see docs/writing-retry-questions.md.\n')
  }

  const evidence = buildClassEvidence(
    paper,
    profiles.map(p => ({ studentRef: p, marks: marksFor(paper, p) })),
  )

  for (const sheet of toWwwEbiSheets(evidence)) {
    console.log('─'.repeat(72))
    console.log(`${sheet.studentRef.toUpperCase()} — ${sheet.score}`)
    if (sheet.coverage) console.log(sheet.coverage)
    console.log()
    const show = (heading: string, lines: string[]) => {
      if (!lines.length) return
      console.log(`  ${heading}`)
      for (const l of lines) console.log(`    • ${l}`)
      console.log()
    }
    show('What went well', sheet.www)
    show('Even better if', sheet.ebi)
    show('Practise these', sheet.practice.map(p => `${p.skill}: ${p.question}`))
    show('Push yourself', sheet.challenge.map(c => `${c.skill}: ${c.question}`))
  }

  console.log('─'.repeat(72))
  const key = answerKeyFor(evidence)
  console.log(`ANSWERS — TEACHER COPY (${key.length} entries)\n`)
  for (const e of key) {
    console.log(`  ${e.skill}`)
    console.log(`  ${e.question}`)
    console.log(`  Answer: ${e.answer}${e.working ? `\n  ${e.working}` : ''}\n`)
  }
  if (!key.length) {
    console.log('  Nothing — no question offered above carries an answer.')
    console.log('  Challenge questions always do; retry questions do only where authored.\n')
  }
}

main()
