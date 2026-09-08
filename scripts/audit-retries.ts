/**
 * Audit every paper's retrySet for the defects a person found by reading one.
 *
 *   npx tsx scripts/audit-retries.ts
 *
 * WHY THIS EXISTS. Retry questions have no automated gate — no parameters, no
 * answer_template, no grader — so verify-question and audit-bank cannot see
 * them at all (docs/writing-retry-questions.md, "Checking it"). The only check
 * is a person reading the review PDF, and a person reads one paper, not
 * fourteen. Every rule below is a defect a review of AQA 1F and 2F June 2025
 * actually turned up; this generalises that reading to the other thirteen
 * papers, so the same mistake does not have to be found twice.
 *
 * Reports only — it changes nothing.
 */
import { PAPERS } from '../lib/demoPapers/index'

type Hit = { paper: string; id: string; note: string }
const hits: Record<string, Hit[]> = {}
const add = (kind: string, paper: string, id: string, note: string) =>
  (hits[kind] ??= []).push({ paper, id, note })

const short = (s: string) => s.replace('aqa-8300-', '').replace('edexcel-', 'edx-').replace('-jun25', '').replace('-nov24', '~n24')

for (const p of Object.values(PAPERS)) {
  const byId = new Map(p.questions.map(q => [q.id, q]))
  for (const [id, r] of Object.entries(p.retrySet)) {
    const q = byId.get(id)!
    const lines = r.question.split('\n')
    const options = lines.filter(l => l.trim().startsWith('[')).map(l => l.replace(/^\s*\[\s*\]\s*/, '').trim())
    const ans = (r.answer ?? '').trim()

    // A. A tick list whose answer is not one of the options, word for word.
    if (options.length && ans && !options.some(o => o.toLowerCase() === ans.toLowerCase())) {
      add('tick list: answer is not one of the options', p.id, id, `answer "${ans}" vs [${options.join(' | ')}]`)
    }

    // B. Says "tick" but offers nothing to tick, and does not ask for working
    //    instead (the deliberate rephrase).
    if (/\btick\b/i.test(r.question) && !options.length &&
        !/show working|give a reason|show your working/i.test(r.question)) {
      add('says "tick" with no boxes', p.id, id, lines[lines.length - 1].slice(0, 70))
    }

    // C. Refers to a table it does not show. A real table here is a following
    //    line carrying a colon or several spaces of alignment.
    // A real <table> block counts, obviously. The looser test behind it is for
    // data still set as aligned text, which is what this rule was written to
    // catch before there was a table to render.
    if (/\b(a|the) table shows\b/i.test(r.question) &&
        !r.question.includes('<table>') &&
        !lines.some(l => /: |\s{2,}/.test(l) && !/table shows/i.test(l))) {
      add('mentions a table it does not show', p.id, id, lines[0].slice(0, 70))
    }

    // D. A retry that rewrites a WHOLE item, labelled with only part of that
    //    item's compound skill. It mirrors the original, so it demands the
    //    original's skills — "3(b² − 2b) when b = 5" labelled Substitution is
    //    under-reporting the Indices in it.
    //
    //    A LETTERED PART of a multi-part item is exempt: there the compound
    //    label describes the question as a whole and each part legitimately
    //    tests one of its skills.
    const siblings = Object.keys(p.retrySet)
      .filter(k => (k.replace(/[a-z]+$/i, '') || k) === (id.replace(/[a-z]+$/i, '') || id)).length
    const isPart = /[a-z]$/i.test(id) && siblings > 1
    if (!isPart && q.skill.includes(' + ') && !r.skill.includes(' + ') && q.skill !== r.skill) {
      add('skill label drops part of the item\'s', p.id, id, `retry "${r.skill}" vs item "${q.skill}"`)
    }

    // E. Foundation exact trig away from 0° and 90°.
    if (/exact trig/i.test(q.skill) && /foundation/i.test(p.subtitle) &&
        /\b(sin|cos|tan)\s*\d+/i.test(r.question) && !/\b(sin|cos|tan)\s*(0|90)\b/i.test(r.question)) {
      add('Foundation exact trig away from 0°/90°', p.id, id, r.question.split('\n')[0].slice(0, 60))
    }

    // F. An estimation question whose roundings do not all go the same way —
    //    the student cannot then know the direction without evaluating.
    if (/1 significant figure/i.test(r.question) && /overestimate|underestimate/i.test(r.question + ans)) {
      const nums = [...r.question.matchAll(/\d+\.\d+/g)].map(m => Number(m[0]))
      const dirs = new Set(nums.map(n => {
        const p1 = Number(n.toPrecision(1))
        return p1 === n ? 'same' : p1 < n ? 'down' : 'up'
      }))
      if (dirs.size > 1) add('estimate: roundings go both ways', p.id, id, `${nums.join(', ')} -> ${[...dirs].join('/')}`)
    }
  }

  // G. Sibling parts sharing a long opening that the sheet CANNOT lift out.
  //
  //    Sharing one is normal and fine: a multi-part question is set as a batch
  //    and wwwEbi's sharedStem() prints the shared scenario once above the
  //    parts. But it can only lift WHOLE LINES — half a hoisted sentence reads
  //    as a fragment. So a long overlap that does not reach a line break is
  //    the case a reader still meets twice, and only that is worth reporting.
  const groups = new Map<string, string[]>()
  for (const id of Object.keys(p.retrySet)) {
    const n = id.replace(/[a-z]+$/i, '') || id
    ;(groups.get(n) ?? groups.set(n, []).get(n)!).push(id)
  }
  for (const [n, ids] of groups) {
    if (ids.length < 2) continue
    const qs = ids.map(i => p.retrySet[i].question)
    let common = 0
    while (common < qs[0].length && qs.every(q => q[common] === qs[0][common])) common++
    const lifted = Math.max(qs[0].lastIndexOf('\n', common - 1), 0)
    if (common - lifted <= 40) continue
    // A WHOLE SENTENCE inside that overlap is the tell. It means a piece of
    // scenario is being restated under each part when it could have been set
    // once — the defect. Without one, the parts merely open with the same
    // words ("Write down the number from the card that is a…"), which is
    // parallel phrasing and exactly how the paper asks it.
    if (!['. ', '? ', '! '].some(m => qs[0].lastIndexOf(m, common - 1) > lifted)) continue
    add('shared opening the sheet cannot lift out', p.id, n,
      `${common - lifted} chars past the last line break: "${qs[0].slice(lifted, lifted + 50).trim()}…"`)
  }
}

for (const [kind, list] of Object.entries(hits)) {
  console.log(`\n### ${kind}  (${list.length})`)
  for (const h of list.slice(0, 14)) console.log(`  ${short(h.paper).padEnd(10)} ${h.id.padEnd(5)} ${h.note}`)
  if (list.length > 14) console.log(`  … and ${list.length - 14} more`)
}
if (!Object.keys(hits).length) console.log('no hits')
