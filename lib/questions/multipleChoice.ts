export function buildOptions(
  correct: string,
  traps: { answer: string }[]
): string[] {
  const trapAnswers = traps
    .map(t => t.answer)
    .filter(a => a !== correct)

  const options = [correct, ...trapAnswers]

  // Pad to 4 if needed
  if (options.length < 4) {
    const padding = generatePadding(correct, options)
    for (const p of padding) {
      if (options.length >= 4) break
      if (!options.includes(p)) options.push(p)
    }
  }

  // Trim to 4 and shuffle
  const final = options.slice(0, 4)
  for (let i = final.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [final[i], final[j]] = [final[j], final[i]]
  }

  return final
}

function generatePadding(correct: string, existing: string[]): string[] {
  const extras: string[] = []

  // Try numeric variants first
  const num = parseFloat(correct.replace(/[^0-9.\-]/g, ''))
  if (!isNaN(num) && correct.trim() === num.toString()) {
    const candidates = [num + 1, num - 1, num + 2, num - 2]
      .map(n => n.toString())
      .filter(c => !existing.includes(c))
    return candidates
  }

  // Sign swap for expressions like (x + 3)(x − 5)
  const signSwapped = correct
    .replace(/\+/g, '§')
    .replace(/−/g, '+')
    .replace(/§/g, '−')
  if (!existing.includes(signSwapped)) extras.push(signSwapped)

  // Replace digits with nearby values
  const digits = correct.match(/\d+/g)
  if (digits) {
    for (const d of [...new Set(digits)]) {
      const n = parseInt(d)
      const v1 = correct.replace(new RegExp(`\\b${d}\\b`), (n + 1).toString())
      const v2 = correct.replace(new RegExp(`\\b${d}\\b`), (n + 2).toString())
      if (!existing.includes(v1) && !extras.includes(v1)) extras.push(v1)
      if (!existing.includes(v2) && !extras.includes(v2)) extras.push(v2)
      if (extras.length >= 3) break
    }
  }

  return extras
}