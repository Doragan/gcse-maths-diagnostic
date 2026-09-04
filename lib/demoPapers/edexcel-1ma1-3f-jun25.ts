import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/3F — Foundation Tier Paper 3 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-F-P3.json by
 * scripts/generate-paper-from-audit.ts. Regenerating overwrites this file, so
 * a hand correction should be noted here — the script refuses to overwrite
 * without --force precisely so corrections are not lost silently.
 *
 * WHAT IS DELIBERATELY ABSENT: `retrySet` and `challengeQuestions` are
 * hand-authored from question text, and the audit transcribes none. A feedback
 * sheet from this paper therefore omits its "Practise these" and "Push
 * yourself" sections and carries everything else — score, coverage, topic and
 * skill breakdown, and the WWW/EBI prose. Fill either object in to turn those
 * sections back on; nothing else needs to change.
 *
 * `desc` is the audit's own note about what each question asks for, not the
 * question text.
 */
export const EDEXCEL_1MA1_3F_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-3f-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'number',   skill: 'Decimals',                                         skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'place value of a digit after the decimal point' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Indices',                                          skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'square root of a decimal' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',               skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'write a percentage as a fraction' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Simplifying Fractions',                            skillIds: ['simplifying_fractions'], kind: 'mastery', visual: false, desc: 'pick the fraction from a list that is not equivalent to a given one' },
    { id: '5',   label: '5',     marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                            skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'give two factors of a number' },
    { id: '6',   label: '6',     marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'how many notes of one denomination make up the rest of a total' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                   skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: true, desc: 'mark a single-outcome probability on a probability scale' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                   skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: true, desc: 'mark a multiple-outcome probability on a probability scale' },
    { id: '8',   label: '8',     marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                               skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'list every pairing of one item from each of two sets' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                      skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'read the coordinates of a marked point off a grid' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                      skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'mark the fourth vertex that completes a square on a grid' },
    { id: '9c',  label: '9(c)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                      skillIds: ['coordinates'], kind: 'mastery', visual: true, desc: 'mark the point that makes a given point the midpoint of a segment' },
    { id: '10',  label: '10',    marks: 1,  topic: 'number',   skill: 'Indices',                                          skillIds: ['indices'], kind: 'mastery', visual: false, desc: 'judge a claimed method for finding a cube root' },
    { id: '11',  label: '11',    marks: 2,  topic: 'number',   skill: 'Converting Measurements',                          skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'difference between two lengths given in different metric units' },
    { id: '12a', label: '12(a)', marks: 1,  topic: 'algebra',  skill: 'Sequences + Substitution',                         skillIds: ['sequences', 'substitution'], kind: 'mastery', visual: false, desc: 'a term of a sequence from its nth-term rule' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'algebra',  skill: 'Sequences',                                        skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'decide whether a value belongs to a linear sequence, with a reason' },
    { id: '13',  label: '13',    marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Angles on lines and Circles', skillIds: ['angles_in_polygons', 'angles_on_lines_and_circles'], kind: 'exam', visual: false, desc: 'angle in a quadrilateral built from straight-line and vertically-opposite angles, giving a reason at each stage' },
    { id: '14a', label: '14(a)', marks: 1,  topic: 'shape',    skill: 'Bearings',                                         skillIds: ['bearings'], kind: 'mastery', visual: false, desc: 'bearing of one point from another on an accurately drawn map' },
    { id: '14b', label: '14(b)', marks: 2,  topic: 'ratio',    skill: 'Ratio + Measuring Lines and Angles',               skillIds: ['ratio', 'measuring_lines_and_angles'], kind: 'exam', visual: false, desc: 'real distance from a measured map length and a stated scale' },
    { id: '15a', label: '15(a)', marks: 1,  topic: 'number',   skill: 'Fractions of Amounts',                             skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'write a part of a total as a fraction' },
    { id: '15b', label: '15(b)', marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',               skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'write a part of a total as a percentage' },
    { id: '16',  label: '16',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                             skillIds: ['fractions_of_amounts'], kind: 'exam', visual: false, desc: 'split the remainder of a total equally once a fractional part is taken out' },
    { id: '17a', label: '17(a)', marks: 3,  topic: 'probdata', skill: 'Frequency Trees',                                  skillIds: ['frequency_trees'], kind: 'mastery', visual: true, desc: 'complete a frequency tree from overlapping totals' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                   skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'probability read off a completed frequency tree' },
    { id: '18',  label: '18',    marks: 3,  topic: 'number',   skill: 'Percentage Change',                                skillIds: ['percentage_change'], kind: 'exam', visual: false, desc: 'percentage deposit, then equal instalments on the balance compared against a bound' },
    { id: '19a', label: '19(a)', marks: 1,  topic: 'probdata', skill: 'Median',                                           skillIds: ['median'], kind: 'mastery', visual: false, desc: 'median from a frequency table' },
    { id: '19b', label: '19(b)', marks: 3,  topic: 'probdata', skill: 'Mean',                                             skillIds: ['mean'], kind: 'mastery', visual: false, desc: 'mean from a frequency table' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'number',   skill: 'Exact Calculations',                               skillIds: ['exact_calculations'], kind: 'mastery', visual: false, desc: 'evaluate a compound fraction on a calculator and give the full display' },
    { id: '20b', label: '20(b)', marks: 1,  topic: 'number',   skill: 'Significant Figures',                              skillIds: ['significant_figures'], kind: 'mastery', visual: false, desc: 'round a decimal to two significant figures' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                              skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'divide two powers of the same letter' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                              skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'raise a power to a power' },
    { id: '21c', label: '21(c)', marks: 1,  topic: 'algebra',  skill: 'Expanding Brackets',                               skillIds: ['expanding_brackets'], kind: 'mastery', visual: false, desc: 'expand a bracket by a single term' },
    { id: '21d', label: '21(d)', marks: 2,  topic: 'algebra',  skill: 'Expanding Double Brackets',                        skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'expand and simplify a product of two linear brackets' },
    { id: '22',  label: '22',    marks: 2,  topic: 'probdata', skill: 'Frequency Diagrams + Grouped Frequency Tables',    skillIds: ['frequency_diagrams', 'grouped_frequency_tables'], kind: 'mastery', visual: true, desc: 'draw a frequency polygon from a grouped frequency table' },
    { id: '23a', label: '23(a)', marks: 1,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',      skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'identify the error in a worked change of subject' },
    { id: '23b', label: '23(b)', marks: 2,  topic: 'algebra',  skill: 'Factorising',                                      skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise fully a two-term expression in two letters' },
    { id: '24',  label: '24',    marks: 3,  topic: 'number',   skill: 'Percentage Change',                                skillIds: ['percentage_change'], kind: 'exam', visual: false, desc: 'percentage profit from a bulk cost and a per-unit selling price' },
    { id: '25',  label: '25',    marks: 4,  topic: 'ratio',    skill: 'Compound Units + Converting Measurements',         skillIds: ['compound_units', 'converting_measurements'], kind: 'exam', visual: false, desc: 'compare unit prices across two currencies and two mass units' },
    { id: '26',  label: '26',    marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                           skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'error interval for a value rounded to one decimal place' },
    { id: '27',  label: '27',    marks: 3,  topic: 'ratio',    skill: 'Compound Units + Time Calculations',               skillIds: ['compound_units', 'time_calculations'], kind: 'exam', visual: false, desc: 'average speed from a distance and a time given in hours and minutes' },
    { id: '28',  label: '28',    marks: 3,  topic: 'shape',    skill: 'Coordinates',                                      skillIds: ['coordinates'], kind: 'exam', visual: false, desc: 'coordinates of a point extending a line segment by a fraction of its length' },
    { id: '29',  label: '29',    marks: 5,  topic: 'shape',    skill: 'Area of a Trapezium + Pythagoras\' Theorem',       skillIds: ['area_of_a_trapezium', 'pythagoras_theorem'], kind: 'exam', visual: false, desc: 'perimeter of a trapezium from its area and two of its sides' },
    { id: '30',  label: '30',    marks: 3,  topic: 'algebra',  skill: 'Simultaneous Equations',                           skillIds: ['simultaneous_equations'], kind: 'mastery', visual: false, desc: 'solve a pair of linear simultaneous equations algebraically' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
