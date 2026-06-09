// Quick manual harness for the answer grader.
//
//   npx tsx scripts/try-grader.ts <type> "<student answer>" "<correct answer>" [tolerance]
//
// type = numeric | exact | fraction | expression | set | ratio | coordinate
//
// Tips: type π as "pi", √2 as "sqrt(2)", ≤ as "<=", ≥ as ">=" — the grader
// normalises all of these. Examples:
//   npx tsx scripts/try-grader.ts ratio      "4:6"        "2:3"
//   npx tsx scripts/try-grader.ts coordinate "x=2, y=1"   "(2,1)"
//   npx tsx scripts/try-grader.ts expression "-3/5 >= x"  "x <= -3/5"
//   npx tsx scripts/try-grader.ts exact      "135*pi"     "135 pi"
//   npx tsx scripts/try-grader.ts exact      "3*sqrt(2)"  "3 sqrt(2)"
//   npx tsx scripts/try-grader.ts fraction   "6/8"        "3/4"
import { checkAnswer } from '../lib/questions/answerChecker'

const [type, student, correct, tol] = process.argv.slice(2)

if (!type || student === undefined || correct === undefined) {
  console.log('Usage: npx tsx scripts/try-grader.ts <type> "<student>" "<correct>" [tolerance]')
  console.log('  type = numeric | exact | fraction | expression | set | ratio | coordinate')
  process.exit(1)
}

const r = checkAnswer(
  student,
  correct,
  type as 'numeric' | 'exact' | 'fraction' | 'expression' | 'set' | 'ratio' | 'coordinate',
  tol ? parseFloat(tol) : null,
  [],
)

console.log(`  student:  ${student}`)
console.log(`  correct:  ${correct}`)
console.log(`  type:     ${type}`)
console.log(`  result:   ${r.correct ? '✓ CORRECT' : '✗ WRONG'}`)
console.log(`  message:  ${r.message}`)
