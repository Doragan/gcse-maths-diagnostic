import type { Investigation, Params, Stage } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// What a percentage change really does — the second investigation.
//
// Chosen over the twenty candidates in docs/audit/31 §5 on two counts.
//
// WEIGHT: 231 marks across the 86-paper corpus, against 143 for the pilot's
// skill, and the §5 list was written from the figure tooling outwards so it is
// entirely graphs. Ranking every skill by marks instead puts straight lines
// twelfth.
//
// SHAPE: it has the best DISCOVERY in the bank. A percentage change is a
// multiplier, multipliers compose, and so going up 20% and then down 20% does
// not return you to where you started. That is not a fact to be told — a
// student who is told it does not believe it. They have to run it and be
// surprised, which is exactly what this layer is for. The wrong answer ("back
// where I started") is what almost everyone thinks, so it is a defensible
// distractor rather than a straw man.
//
// It DRAWS NOTHING. §5 always said a skill whose behaviour shows in a table
// needs no figure, but `Control.render` was required until now, so the whole
// table-native half of the candidate list could not be expressed. This is the
// first one to exercise that, which is the more useful way to stress the shell
// than a second kind of grid would have been.
// ─────────────────────────────────────────────────────────────────────────────

/** Money, with pence only when there are any. */
function money(n: number): string {
  const r = Math.round(n * 100) / 100
  return `£${Number.isInteger(r) ? r : r.toFixed(2)}`
}

/** A decimal with no trailing zeros: 1.1, not 1.10. */
function dec(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

// ─── Section checks ──────────────────────────────────────────────────────────
//
// Published bank questions, one per section, each chosen for the half of the
// idea its section built. Not authored here: a bank question brings its drawn
// parameters, the verification harness and its authored traps.

/** "Increase £a by b%." (d2, numeric) — traps the increase-on-its-own. */
const Q_INCREASE = '95790f96-a9fb-4ca0-ba1f-c9d9c80508aa'
/** "Decrease £a by b%." (d2, numeric) — same shape, the other direction. */
const Q_DECREASE = '3a2a4da5-2798-45a2-9386-7449f4f7139a'
/**
 * "£a at r% compound interest for n years." (d4, numeric)
 *
 * On growth_and_decay rather than percentage_change, deliberately: section 3
 * is about multipliers COMPOSING, and compound interest is that idea with
 * nothing else attached. Its two traps are both `simple_instead_of_compound`,
 * which is this misconception wearing a different hat — multiplying the
 * percentage by the years instead of the multiplier by itself.
 */
const Q_COMPOUND = '5336bd5e-7fa8-4fa8-9a67-387b9b684d0a'
/**
 * "The radius of a circle is increased by p%. Find the percentage increase in
 * the area." (d5, numeric)
 *
 * The challenge, and it needs a second skill (area scales by the square of the
 * length multiplier), which is why it is not the ordinary check.
 */
const Q_AREA = '7536046f-b58f-49f2-8461-b3725bd4a3a8'

// ─── Stage 1: an increase is a multiplication ────────────────────────────────

function stageIncrease(p: Params): Stage {
  const start = p.start
  const q = p.pUp
  return {
    ask: `${money(start)} goes up by ${q}%. Before working anything out — what single number `
      + `would you multiply ${money(start)} by to land on the answer in one step?`,
    predict: {
      prompt: 'Multiply by…',
      on: {
        kind: 'choice',
        options: [dec(1 + q / 100), dec(q / 100), String(q)],
        correct: 0,
      },
      right: `${money(start)} × ${dec(1 + q / 100)} = ${money(start * (1 + q / 100))}, in one `
        + 'step. Now try some percentages of your own and watch that number.',
      wrong: `It is ${dec(1 + q / 100)}. ${dec(q / 100)} gives you the ${q}% on its own — the bit `
        + 'you would still have to add on. Try some percentages and watch the last column.',
    },
    control: {
      name: 'increase',
      prompt: `Pick a percentage and see what ${money(start)} becomes.`,
      hint: 'Whole percentages from 5 to 50, in fives.',
      domain: { min: 5, max: 50, step: 5 },
      suggest: [10, 45],
      label: v => `an increase of ${v}%`,
      row: v => [
        `${v}%`,
        money(start * v / 100),
        money(start * (1 + v / 100)),
        dec(1 + v / 100),
      ],
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second percentage — one row cannot show you what changes and what does not.'
        : null),
    },
    observe: {
      headers: [
        'increase of', 'the increase on its own', 'you end up with', 'end ÷ start',
      ],
    },
    conclude: {
      sentence: [
        'To increase by a percentage in one step, multiply by ',
        ', and the extra you are adding is that percentage of ',
        '.',
      ],
      slots: [
        {
          options: ['1 + the percentage ÷ 100', 'the percentage ÷ 100'],
          correct: 0,
          diagnosis: [
            '',
            'That is the middle column — the increase on its own, which you would still have to '
            + 'add on. The last column is what multiplies the original in one go, and it is '
            + 'always bigger than 1.',
          ],
          misconception: ['', 'omitted_a_final_step'],
        },
        {
          options: ['the amount you started with', 'the amount you end up with'],
          correct: 0,
          diagnosis: [
            '',
            'Check a row: the increase in the middle column is the percentage of the STARTING '
            + 'amount, not of the total you reach. Which amount a percentage is taken from is '
            + 'the thing to keep hold of — section 3 is entirely about it.',
          ],
          misconception: ['', 'percentage_from_the_wrong_base'],
        },
      ],
      because: 'Keeping the original and adding a bit on is the same as multiplying by a number '
        + 'slightly bigger than 1. The 1 keeps what you already had, and the decimal part adds '
        + 'the percentage on top — so one multiplication does both jobs at once.',
      algebraLead: 'In symbols, with P for the percentage. The 1 is the amount you keep, and the '
        + 'fraction is what gets added:',
      algebra: 'new = old + (P ÷ 100) × old\n'
        + '  = old × (1 + P ÷ 100)',
    },
    naming: {
      term: 'the multiplier',
      means: 'The multiplier is the single number a percentage change multiplies by. An '
        + 'increase of P% has multiplier 1 + P ÷ 100, which is always more than 1.',
      elsewhere: 'Shops and banks work in multipliers rather than percentages because they '
        + 'chain: a price marked up and then discounted is two multiplications in a row, and '
        + 'nobody wants to add and subtract their way through that twice.',
      onThePaper: 'Increase £240 by 15%. / Write down the multiplier for an increase of 15%.',
    },
    check: [
      {
        questionId: Q_INCREASE,
        because: 'The increase, straight. Its traps are exactly the two wrong answers this '
          + 'section rules out: giving the increase on its own, and adding the percentage as '
          + 'if it were pounds.',
      },
    ],
  }
}

// ─── Stage 2: a decrease is the same move, the other way ─────────────────────

function stageDecrease(p: Params): Stage {
  const start = p.start
  const q = p.pDown
  return {
    ask: `Now the other way. ${money(start)} goes DOWN by ${q}%. What is the single number to `
      + 'multiply by this time?',
    predict: {
      prompt: 'Multiply by…',
      on: {
        kind: 'choice',
        options: [dec(1 - q / 100), dec(q / 100), dec(1 + q / 100)],
        correct: 0,
      },
      right: `${money(start)} × ${dec(1 - q / 100)} = ${money(start * (1 - q / 100))}. It is `
        + 'still a multiplication, and the multiplier is still built from a 1.',
      wrong: `It is ${dec(1 - q / 100)}. You keep ${100 - q}% of what you had, and `
        + `${100 - q}% is ${dec(1 - q / 100)}. Draw a few and watch the last column.`,
    },
    control: {
      name: 'decrease',
      prompt: `Pick a percentage to take off ${money(start)}.`,
      hint: 'Whole percentages from 5 to 50, in fives.',
      domain: { min: 5, max: 50, step: 5 },
      suggest: [15, 40],
      label: v => `a decrease of ${v}%`,
      row: v => [
        `${v}%`,
        `${100 - v}%`,
        money(start * (1 - v / 100)),
        dec(1 - v / 100),
      ],
      coverage: drawn => (new Set(drawn).size < 2
        ? 'Try a second percentage, so you can see which part of the multiplier moves.'
        : null),
    },
    observe: {
      headers: ['decrease of', 'so you keep', 'you end up with', 'end ÷ start'],
    },
    conclude: {
      sentence: [
        'To decrease by a percentage, multiply by ',
        ', which is a number that is ',
        '.',
      ],
      slots: [
        {
          options: ['1 − the percentage ÷ 100', '− the percentage ÷ 100'],
          correct: 0,
          diagnosis: [
            '',
            'A multiplier is never negative here — multiplying money by a negative number would '
            + 'leave you owing it. Read the "so you keep" column: taking 30% off means keeping '
            + '70%, and 70% is 0.7.',
          ],
          misconception: ['', 'sign_error'],
        },
        {
          options: ['between 0 and 1', 'more than 1'],
          correct: 0,
          diagnosis: [
            '',
            'Only an increase multiplies by more than 1. Every multiplier in the last column is '
            + 'smaller than 1, which is what makes the amount shrink.',
          ],
          misconception: ['', ''],
        },
      ],
      because: 'A decrease is not a different operation from an increase — it is the same one '
        + 'with a smaller multiplier. Taking P% off means keeping (100 − P)% of what you had, '
        + 'and that is what 1 − P ÷ 100 is: the fraction you keep.',
      algebraLead: 'The same line as before, with the fraction taken away instead of added:',
      algebra: 'new = old − (P ÷ 100) × old\n'
        + '  = old × (1 − P ÷ 100)',
    },
    naming: {
      term: 'keeping, not losing',
      means: 'It is worth reading a decrease multiplier as what you KEEP rather than what you '
        + 'lose. A 35% discount has multiplier 0.65, and 0.65 is the 65% you still pay.',
      elsewhere: 'A sale sign says 40% off, but the till multiplies by 0.6. The sign names the '
        + 'part that goes; the arithmetic names the part that stays.',
      onThePaper: 'Decrease 480 by 35%. / A coat costs £80 in a 15% sale. Find the sale price.',
    },
    check: [
      {
        questionId: Q_DECREASE,
        because: 'The decrease, straight — the mirror of the first section’s check, with '
          + 'the same two traps pointing the other way.',
      },
    ],
  }
}

// ─── Stage 3: the one that surprises people ──────────────────────────────────

function stageBothWays(p: Params): Stage {
  const start = p.start
  const q = p.pBoth
  const back = start * (1 + q / 100) * (1 - q / 100)
  return {
    ask: `${money(start)} goes up by ${q}%. Then that new amount goes down by ${q}% — the same `
      + 'percentage, straight back off. Where do you end up?',
    predict: {
      prompt: 'After up and then down by the same percentage, you have…',
      on: {
        kind: 'choice',
        options: [
          `less than ${money(start)}`,
          `exactly ${money(start)}`,
          `more than ${money(start)}`,
        ],
        correct: 0,
      },
      right: `And most people say ${money(start)}. You end on ${money(back)}. Work out a few `
        + 'more and see whether it ever comes back to the start.',
      wrong: `It is less: ${money(back)}. Almost everybody says ${money(start)}, which is why `
        + 'this is worth doing rather than being told. Try some percentages of your own.',
    },
    control: {
      name: 'percentage',
      prompt: 'Pick a percentage. It goes up by that, then down by the same.',
      hint: 'Whole percentages from 10 to 50, in tens.',
      domain: { min: 10, max: 50, step: 10 },
      suggest: [10, 50],
      label: v => `up ${v}% then down ${v}%`,
      row: v => [
        `${v}%`,
        `${dec(1 + v / 100)} × ${dec(1 - v / 100)}`,
        dec((1 + v / 100) * (1 - v / 100)),
        money(start * (1 + v / 100) * (1 - v / 100)),
      ],
      coverage: drawn => {
        if (new Set(drawn).size < 2) {
          return 'One row could be a fluke. Try another percentage.'
        }
        if (!drawn.some(v => v >= 40)) {
          return 'Now try a big one — 40% or 50% — and see whether the gap stays small.'
        }
        return null
      },
    },
    observe: {
      headers: [
        'up then down by', 'the two multipliers', 'multiplied together', 'you end with',
      ],
    },
    conclude: {
      sentence: [
        'Going up and then down by the same percentage leaves you with ',
        ', because the decrease is worked out on ',
        '.',
      ],
      slots: [
        {
          options: ['less than you started with', 'exactly what you started with'],
          correct: 0,
          diagnosis: [
            '',
            'Look at the third column: the two multipliers never multiply to 1. They come to '
            + 'just under it, every time, for every percentage you tried.',
          ],
          misconception: ['', 'percentage_from_the_wrong_base'],
        },
        {
          options: [
            'a bigger amount than the increase was',
            'the amount you first started with',
          ],
          correct: 0,
          diagnosis: [
            '',
            'The decrease is taken off the amount AFTER the rise, which is bigger than what you '
            + 'began with. The same percentage of a bigger amount is more money — so more comes '
            + 'off than went on.',
          ],
          misconception: ['', 'percentage_from_the_wrong_base'],
        },
      ],
      because: 'The two changes are the same percentage but not the same amount of money. The '
        + 'rise is worked out on what you started with; the fall is worked out on the larger '
        + 'amount you had after the rise, so it takes more off than the rise put on. The '
        + 'multipliers say it more directly: they come to just under 1, and the bigger the '
        + 'percentage the further under it they land.',
      algebraLead: 'Multiplying the two multipliers together is a difference of two squares, and '
        + 'it shows exactly how much you lose:',
      algebra: '(1 + P ÷ 100) × (1 − P ÷ 100)\n'
        + '  = 1 − (P ÷ 100)²',
    },
    naming: {
      term: 'multipliers compose',
      means: 'Changes one after another MULTIPLY — you do not add the percentages. Two changes '
        + 'in a row mean two multipliers in a row, and the same multiplier applied n times is '
        + 'that multiplier to the power n.',
      elsewhere: 'This is why compound interest beats simple interest, why inflation of 3% a '
        + 'year for five years is not 15%, and why a shop can mark up by 50% and then hold a '
        + '"50% off" sale without losing money.',
      onThePaper: 'A price rises by 10% and then falls by 10%. Find the overall percentage '
        + 'change. / £2000 at 3% compound interest for 4 years.',
    },
    aside: {
      head: 'Does the order matter?',
      body: 'No — and that is worth noticing. Down-then-up lands on exactly the same amount, '
        + 'because multiplication does not care which way round you do it. What matters is '
        + 'that the two percentages are of different amounts, not which one happens first.',
    },
    check: [
      {
        questionId: Q_COMPOUND,
        because: 'Repeated multiplication with nothing else attached. Both of its traps are '
          + 'simple interest — multiplying the percentage by the years instead of the '
          + 'multiplier by itself, which is this section’s misconception exactly.',
      },
      {
        questionId: Q_AREA,
        challenge: true,
        because: 'The same multiplier applied twice, hidden inside a circle: scale the radius '
          + 'by 1.2 and the area scales by 1.2². It needs area as well, which is why it is '
          + 'the challenge rather than the check.',
      },
    ],
  }
}

export const percentageChangeInvestigation: Investigation = {
  skillId: 'percentage_change',
  title: 'What a Percentage Change Really Does',
  outcomes: 'Every percentage change is one multiplication. By the end of this you will be able '
    + 'to write down the multiplier for any increase or decrease, use it in one step instead of '
    + 'two, and say what happens when changes follow one another — which is not what most '
    + 'people expect.',
  underConstruction: 'This one is new and still being worked on. The maths is right, but the '
    + 'wording and the questions at the end of each section may still change.',
  parameters: {
    values: {
      // Round amounts only: the arithmetic is not the point here, and pence in
      // the stem would make the table about rounding instead of multipliers.
      start: [200, 400, 500],
      // Stage 1's prediction. Away from 50, or "1 + P/100" and "P/100" would
      // be two different options rendering as 1.5 and 0.5 — fine — but 100
      // would collide with the third option.
      pUp: [10, 20, 25],
      // Stage 2's. Never 50: there 1 − P/100 and P/100 are both 0.5, and the
      // prediction would offer the same answer twice.
      pDown: [10, 20, 25, 40],
      // Stage 3's. Big enough that the shortfall is visible in pounds rather
      // than pence — at 5% on £200 it is 50p, which reads as a rounding slip.
      pBoth: [10, 20, 25],
    },
    // Three different percentages across the three stages, so a student cannot
    // carry one section's arithmetic into the next instead of redoing it.
    valid: p => p.pUp !== p.pDown && p.pDown !== p.pBoth && p.pUp !== p.pBoth,
  },
  build: p => [stageIncrease(p), stageDecrease(p), stageBothWays(p)],
  /**
   * The handover. Both are d4 and both wrap the multiplier in something else —
   * a ratio share, then a best-buy comparison — which is how the skill appears
   * on a paper once it stops being asked for directly.
   */
  transferQuestionIds: [
    '245fb5b8-cb5a-497e-ae90-1e98f3beadcf',  // ratio share, then 20% spent (d4)
    '7a289a0d-e649-49d5-9777-b379d8971de0',  // comparing two shops (d4)
  ],
}
