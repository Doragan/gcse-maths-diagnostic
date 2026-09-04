import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/1H — Higher Tier Paper 1 Non-calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-H-P1.json by
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
export const EDEXCEL_1MA1_1H_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-1h-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                      skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two two-digit-and-up numbers' },
    { id: '2a',    label: '2(a)',    marks: 3,  topic: 'probdata', skill: 'Mutually Exclusive Events + Calculating Simple Probability', skillIds: ['mutually_exclusive_events', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'missing probability from a table, given a ratio between two of the outcomes' },
    { id: '2b',    label: '2(b)',    marks: 2,  topic: 'probdata', skill: 'Expected Outcomes',                                          skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: 'total population from a known probability and its frequency' },
    { id: '3a',    label: '3(a)',    marks: 2,  topic: 'algebra',  skill: 'Substitution',                                               skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'complete a table of values for a quadratic' },
    { id: '3b',    label: '3(b)',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                        skillIds: ['quadratic_functions'], kind: 'mastery', visual: true, desc: 'plot a quadratic curve over a given domain' },
    { id: '3c',    label: '3(c)',    marks: 1,  topic: 'algebra',  skill: 'Quadratic Functions',                                        skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read the turning point off a drawn curve' },
    { id: '4a',    label: '4(a)',    marks: 5,  topic: 'ratio',    skill: 'Ratio + Fractions of Amounts',                               skillIds: ['ratio', 'fractions_of_amounts'], kind: 'exam', visual: false, desc: 'chain two ratios through a fractional part of a total' },
    { id: '4b',    label: '4(b)',    marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                      skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'state whether a change to one quantity affects a ratio, with a reason' },
    { id: '5',     label: '5',       marks: 3,  topic: 'number',   skill: 'Standard Form',                                              skillIds: ['standard_form'], kind: 'mastery', visual: false, desc: 'add two numbers in standard form, answer in standard form' },
    { id: '6',     label: '6',       marks: 4,  topic: 'shape',    skill: 'Angles in Polygons + Exterior Angles',                       skillIds: ['angles_in_polygons', 'exterior_angles'], kind: 'exam', visual: false, desc: 'number of sides of a regular polygon from an interior angle built up from a triangle and a square' },
    { id: '7a',    label: '7(a)',    marks: 1,  topic: 'algebra',  skill: 'Simplifying Expressions',                                    skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'simplify an algebraic fraction to a linear expression' },
    { id: '7b',    label: '7(b)',    marks: 3,  topic: 'algebra',  skill: 'Inequalities',                                               skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'solve a linear inequality carrying a fractional term' },
    { id: '7c',    label: '7(c)',    marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                               skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'solve a double-ended inequality' },
    { id: '8a',    label: '8(a)',    marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'prove two triangles similar, giving an angle reason at each stage' },
    { id: '8b',    label: '8(b)',    marks: 3,  topic: 'shape',    skill: 'Congruence and Similarity',                                  skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'part of a side from a scale factor between similar triangles' },
    { id: '9a',    label: '9(a)',    marks: 2,  topic: 'shape',    skill: 'Rotations',                                                  skillIds: ['rotations'], kind: 'mastery', visual: false, desc: 'describe a single transformation fully from two drawn shapes' },
    { id: '9b',    label: '9(b)',    marks: 2,  topic: 'shape',    skill: 'Fractional and Negative Enlargements',                       skillIds: ['fractional_enlargements'], kind: 'mastery', visual: true, desc: 'enlarge a shape by a fractional scale factor about a given centre' },
    { id: '10',    label: '10',      marks: 3,  topic: 'algebra',  skill: 'Algebraic Proof',                                            skillIds: ['algebraic_proof'], kind: 'exam', visual: false, desc: 'prove a general result about the squares of two consecutive even numbers' },
    { id: '11',    label: '11',      marks: 5,  topic: 'ratio',    skill: 'Inverse Proportion + Proportion with Powers',                skillIds: ['inverse_proportion', 'proportion_with_powers'], kind: 'exam', visual: false, desc: 'chain an inverse proportion with a direct proportion to a cube root' },
    { id: '12ai',  label: '12(ai)',  marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs',                                           skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'estimate the gradient of a curved velocity-time graph by drawing a tangent' },
    { id: '12aii', label: '12(aii)', marks: 1,  topic: 'algebra',  skill: 'Kinematic Graphs',                                           skillIds: ['kinematic_graphs'], kind: 'mastery', visual: false, desc: 'say what the gradient of a velocity-time graph represents' },
    { id: '12b',   label: '12(b)',   marks: 3,  topic: 'algebra',  skill: 'Kinematic Graphs + Area of a Trapezium',                     skillIds: ['kinematic_graphs', 'area_of_a_trapezium'], kind: 'exam', visual: false, desc: 'estimate the area under a curve using three strips of equal width' },
    { id: '13',    label: '13',      marks: 5,  topic: 'number',   skill: 'Recurring Decimals to Fractions + Multiplying Fractions',    skillIds: ['recurring_decimals_to_fractions', 'multiplying_fractions'], kind: 'exam', visual: false, desc: 'convert two recurring decimals to fractions and multiply them' },
    { id: '14',    label: '14',      marks: 5,  topic: 'probdata', skill: 'Combined Events + Mutually Exclusive Events',                skillIds: ['combined_events', 'mutually_exclusive_events'], kind: 'exam', visual: false, desc: 'compare two compound probabilities for two objects taken without replacement' },
    { id: '15',    label: '15',      marks: 4,  topic: 'probdata', skill: 'Histograms + Calculating Simple Probability',                skillIds: ['histograms', 'calculating_simple_probability'], kind: 'exam', visual: false, desc: 'probability from a histogram over an interval spanning more than one bar' },
    { id: '16a',   label: '16(a)',   marks: 2,  topic: 'number',   skill: 'Expanding and Rationalising Surds',                          skillIds: ['surds_expanding_and_rationalising'], kind: 'mastery', visual: false, desc: 'rationalise a denominator that is a single surd' },
    { id: '16b',   label: '16(b)',   marks: 4,  topic: 'number',   skill: 'Expanding and Rationalising Surds + Simplifying Surds',      skillIds: ['surds_expanding_and_rationalising', 'surds_simplifying'], kind: 'exam', visual: false, desc: 'rationalise a two-term surd denominator and give the result in a stated form' },
    { id: '17',    label: '17',      marks: 5,  topic: 'algebra',  skill: 'Composite Functions + Expanding Double Brackets',            skillIds: ['composite_functions', 'expanding_double_brackets'], kind: 'exam', visual: false, desc: 'form two composite functions and show the resulting equation has exactly one solution' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
