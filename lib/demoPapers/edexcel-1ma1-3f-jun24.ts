import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/3F — Foundation Tier Paper 3 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN24-F-P3.json by
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
export const EDEXCEL_1MA1_3F_JUN24: PaperConfig = {
  id: 'edexcel-1ma1-3f-jun24',
  title: 'Edexcel GCSE Mathematics 1MA1/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',              skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'percentage to fraction conversion' },
    { id: '2',     label: '2',       marks: 1,  topic: 'number',   skill: 'Converting Measurements',                         skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'metric length conversion' },
    { id: '3',     label: '3',       marks: 1,  topic: 'number',   skill: 'Decimals',                                        skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'place value of a digit in a five-digit whole number' },
    { id: '4',     label: '4',       marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                         skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'collect three like terms, one pair cancelling' },
    { id: '5',     label: '5',       marks: 1,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'order three fractions with unrelated denominators' },
    { id: '6a',    label: '6(a)',    marks: 2,  topic: 'ratio',    skill: 'Ratio + Converting Measurements',                 skillIds: ['ratio', 'converting_measurements'], kind: 'mastery', visual: false, desc: 'real distance from a map distance and a stated scale' },
    { id: '6b',    label: '6(b)',    marks: 2,  topic: 'ratio',    skill: 'Ratio + Converting Measurements',                 skillIds: ['ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'map distance from a real distance, with the units to be chosen and stated' },
    { id: '7a',    label: '7(a)',    marks: 1,  topic: 'probdata', skill: 'Mode + Simple Charts',                            skillIds: ['mode', 'simple_charts'], kind: 'mastery', visual: false, desc: 'the modal category of a bar chart' },
    { id: '7b',    label: '7(b)',    marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                   skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'difference between two bars on a bar chart' },
    { id: '8',     label: '8',       marks: 3,  topic: 'number',   skill: 'Factors and Multiples',                           skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'decide whether a stated year falls in a five-yearly sequence anchored to a derived start year' },
    { id: '9',     label: '9',       marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'show a budget covers three charges, each a daily or hourly rate times a quantity' },
    { id: '10a',   label: '10(a)',   marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                               skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: true, desc: 'draw a radius on a circle' },
    { id: '10b',   label: '10(b)',   marks: 1,  topic: 'shape',    skill: 'Parts of a Circle',                               skillIds: ['parts_of_a_circle'], kind: 'mastery', visual: false, desc: 'name a chord' },
    { id: '11',    label: '11',      marks: 2,  topic: 'number',   skill: 'Time Calculations',                               skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'total duration in hours, from a count and a length in minutes' },
    { id: '12',    label: '12',      marks: 2,  topic: 'number',   skill: 'Factors and Multiples',                           skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'three primes inside a stated range' },
    { id: '13',    label: '13',      marks: 3,  topic: 'probdata', skill: 'Gathering and Organising Data',                   skillIds: ['gathering_and_organising_data'], kind: 'mastery', visual: false, desc: 'complete a two-way table from partial row, column and overall totals' },
    { id: '14',    label: '14',      marks: 3,  topic: 'probdata', skill: 'Pie Charts',                                      skillIds: ['pie_charts'], kind: 'mastery', visual: true, desc: 'draw and label an accurate pie chart from three frequencies' },
    { id: '15',    label: '15',      marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                            skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'decide which of two percentages of two different amounts is greater' },
    { id: '16a',   label: '16(a)',   marks: 1,  topic: 'number',   skill: 'Simplifying Indices',                             skillIds: ['simplifying_indices'], kind: 'mastery', visual: false, desc: 'a repeated product of one letter written as a power' },
    { id: '16b',   label: '16(b)',   marks: 2,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'expression in two letters for a total built from two per-item scores' },
    { id: '17',    label: '17',      marks: 3,  topic: 'ratio',    skill: 'Proportion',                                      skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'scale three recipe quantities from one batch size to another' },
    { id: '18a',   label: '18(a)',   marks: 2,  topic: 'shape',    skill: 'Rotations',                                       skillIds: ['rotations'], kind: 'mastery', visual: true, desc: 'rotate a shape a half turn about the origin' },
    { id: '18b',   label: '18(b)',   marks: 1,  topic: 'shape',    skill: 'Reflections',                                     skillIds: ['reflections'], kind: 'mastery', visual: false, desc: 'explain that a reflection was done in a horizontal line rather than the stated vertical one' },
    { id: '19',    label: '19',      marks: 3,  topic: 'algebra',  skill: 'Plotting Straight Line Graphs',                   skillIds: ['plotting_straight_line_graphs'], kind: 'mastery', visual: true, desc: 'draw a straight line from its equation over a stated domain' },
    { id: '20',    label: '20',      marks: 5,  topic: 'shape',    skill: 'Angles on Lines and Circles + Simplifying Ratio', skillIds: ['angles_on_lines_and_circles', 'simplifying_ratio'], kind: 'exam', visual: false, desc: 'ratio of two angles in the form 1 : n, chained through two isosceles triangles sharing a side' },
    { id: '21a',   label: '21(a)',   marks: 1,  topic: 'algebra',  skill: 'Factorising',                                     skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise a two-term linear expression with a numerical common factor' },
    { id: '21b',   label: '21(b)',   marks: 1,  topic: 'algebra',  skill: 'Factorising',                                     skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'factorise a two-term quadratic with a letter common factor' },
    { id: '22',    label: '22',      marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                           skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two two- and three-digit numbers' },
    { id: '23ai',  label: '23(ai)',  marks: 1,  topic: 'number',   skill: 'Standard Form',                                   skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard form to an ordinary number, positive index' },
    { id: '23aii', label: '23(aii)', marks: 1,  topic: 'number',   skill: 'Standard Form',                                   skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'standard form to an ordinary number, negative index' },
    { id: '23b',   label: '23(b)',   marks: 2,  topic: 'number',   skill: 'Standard Form',                                   skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'add two standard-form values with different indices, answer in standard form' },
    { id: '24a',   label: '24(a)',   marks: 1,  topic: 'shape',    skill: 'Plans and Elevations',                            skillIds: ['plans_and_elevations'], kind: 'mastery', visual: false, desc: 'explain why a side elevation drawn with the slant height rather than the perpendicular height is wrong' },
    { id: '24b',   label: '24(b)',   marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                            skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'draw the plan of a triangular prism on a centimetre grid' },
    { id: '25',    label: '25',      marks: 4,  topic: 'ratio',    skill: 'Growth and Decay',                                skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'population after three years of a stated compound percentage increase' },
    { id: '26',    label: '26',      marks: 4,  topic: 'ratio',    skill: 'Compound Units',                                  skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'density of a second substance, its volume found from an identical tin\'s capacity less an unfilled space' },
    { id: '27a',   label: '27(a)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                   skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a two-stage probability tree for two differently biased coins' },
    { id: '27b',   label: '27(b)',   marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                   skillIds: ['tree_diagrams'], kind: 'mastery', visual: false, desc: 'probability of both events from a completed tree' },
    { id: '28',    label: '28',      marks: 4,  topic: 'shape',    skill: 'Volume of a Prism + Compound Units',              skillIds: ['volume_of_a_prism', 'compound_units'], kind: 'exam', visual: false, desc: 'minutes to fill a cylinder at a stated volume rate, to the nearest minute' },
    { id: '29a',   label: '29(a)',   marks: 2,  topic: 'algebra',  skill: 'Substitution',                                    skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'substitute a negative value into a formula with a squared term' },
    { id: '29b',   label: '29(b)',   marks: 2,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',     skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'change the subject where the new subject is inside a fraction' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
