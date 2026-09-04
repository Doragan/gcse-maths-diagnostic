import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1F — Foundation Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-F-P1.json by
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
 *
 * KNOWN GAPS in this paper, carried here so they survive regeneration:
 *   • item 8(a) is untagged by design — filed under Shape and Space, contributing 1 mark(s) with no skill evidence. Check coding_notes says why.
 */
export const EDEXCEL_1MA1_1F_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-1f-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                          skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'collect repeated like terms' },
    { id: '2',   label: '2',     marks: 1,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                 skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'write a simple fraction as a decimal' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Converting Measurements',                                          skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: 'metric length conversion' },
    { id: '4',   label: '4',     marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                            skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'give a multiple within a range' },
    { id: '5',   label: '5',     marks: 1,  topic: 'shape',    skill: 'Angles on lines and Circles',                                      skillIds: ['angles_on_lines_and_circles'], kind: 'mastery', visual: false, desc: 'name the type of a given angle' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'read two values from a table and add' },
    { id: '6b',  label: '6(b)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                                                skillIds: ['simple_arithmetic'], kind: 'exam', visual: false, desc: 'compare two totals against a multiplicative claim, with working' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'probdata', skill: 'Simple Charts',                                                    skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'complete a bar chart from given figures' },
    { id: '7b',  label: '7(b)',  marks: 3,  topic: 'number',   skill: 'Simple Arithmetic + Simple Charts',                                skillIds: ['simple_arithmetic', 'simple_charts'], kind: 'exam', visual: false, desc: 'total mixed-denomination money read from a chart, compared with a bound' },
    { id: '8a',  label: '8(a)',  marks: 1,  topic: 'shape',    skill: 'Untagged',                                                         skillIds: [], kind: 'mastery', visual: true, desc: 'complete a kite on a grid from two given sides' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                                          skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'name a solid from its picture' },
    { id: '9a',  label: '9(a)',  marks: 1,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                                 skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'write an expression for an age, given a difference' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'algebra',  skill: 'Forming Expressions and Formulae',                                 skillIds: ['forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'write an expression for an age, given a multiple' },
    { id: '9c',  label: '9(c)',  marks: 1,  topic: 'algebra',  skill: 'Solving Linear Equations',                                         skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a one-step equation' },
    { id: '10a', label: '10(a)', marks: 1,  topic: 'number',   skill: 'Rounding',                                                         skillIds: ['rounding'], kind: 'mastery', visual: false, desc: 'round to the nearest thousand' },
    { id: '10b', label: '10(b)', marks: 2,  topic: 'number',   skill: 'Estimating',                                                       skillIds: ['estimating'], kind: 'mastery', visual: false, desc: 'estimate a product by rounding both factors' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions',                                 skillIds: ['adding_and_subtracting_fractions'], kind: 'mastery', visual: false, desc: 'subtract fractions with different denominators' },
    { id: '11b', label: '11(b)', marks: 2,  topic: 'number',   skill: 'Fractions of Amounts',                                             skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: 'find a fraction of a quantity' },
    { id: '12a', label: '12(a)', marks: 3,  topic: 'number',   skill: 'Time Calculations',                                                skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'compare journey durations from a timetable, with working' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'number',   skill: 'Time Calculations',                                                skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'waiting time from a timetable with a stated delay' },
    { id: '13a', label: '13(a)', marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'forward through a two-step machine' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'inverse through a two-step machine, negative output' },
    { id: '14',  label: '14',    marks: 3,  topic: 'ratio',    skill: 'Ratio + Converting Measurements',                                  skillIds: ['ratio', 'converting_measurements'], kind: 'exam', visual: false, desc: 'map scale applied to a real length, answer in a different unit' },
    { id: '15',  label: '15',    marks: 3,  topic: 'number',   skill: 'Decimals',                                                         skillIds: ['decimals'], kind: 'mastery', visual: false, desc: 'written multiplication of a decimal by a two-digit integer' },
    { id: '16',  label: '16',    marks: 4,  topic: 'shape',    skill: 'Alternate and Corresponding Angles + Angles on lines and Circles', skillIds: ['alternate_and_corresponding_angles', 'angles_on_lines_and_circles'], kind: 'exam', visual: false, desc: 'prove two lines parallel, giving an angle reason at each stage' },
    { id: '17',  label: '17',    marks: 3,  topic: 'ratio',    skill: 'Proportion',                                                       skillIds: ['proportion'], kind: 'mastery', visual: false, desc: 'scale a recipe and check four quantities against what is available' },
    { id: '18',  label: '18',    marks: 3,  topic: 'probdata', skill: 'Gathering and Organising Data',                                    skillIds: ['gathering_and_organising_data'], kind: 'mastery', visual: true, desc: 'construct a stem and leaf diagram, including a key' },
    { id: '19',  label: '19',    marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                            skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two numbers' },
    { id: '20a', label: '20(a)', marks: 3,  topic: 'probdata', skill: 'Mutually Exclusive Events + Calculating Simple Probability',       skillIds: ['mutually_exclusive_events', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'missing probability from a table, given a ratio between two outcomes' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'probdata', skill: 'Expected Outcomes',                                                skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: 'total population from a known probability and its frequency' },
    { id: '21a', label: '21(a)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                     skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '21b', label: '21(b)', marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                              skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve over a given domain' },
    { id: '21c', label: '21(c)', marks: 1,  topic: 'algebra',  skill: 'Quadratic Functions',                                              skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read the turning point off a drawn curve' },
    { id: '22a', label: '22(a)', marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                                     skillIds: ['ratio', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'chain two ratios through a fractional part of a total' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'state whether a change to one quantity affects a ratio, with a reason' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Standard Form',                                                    skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'add two numbers in standard form, answer in standard form' },
    { id: '24',  label: '24',    marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Exterior Angles',                             skillIds: ['angles_in_polygons', 'exterior_angles'], kind: 'exam', visual: false, desc: 'number of sides of a regular polygon from an interior angle built up from a triangle and a square' },
    { id: '25',  label: '25',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                               skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'equation of a drawn line in y = mx + c form' },
    { id: '26',  label: '26',    marks: 2,  topic: 'shape',    skill: 'Vectors',                                                          skillIds: ['vectors'], kind: 'mastery', visual: false, desc: 'linear combination of two column vectors' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
