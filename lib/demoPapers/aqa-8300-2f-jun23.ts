import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2F — Foundation Tier Paper 2 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/JUN23-F-P2.json by
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
export const AQA_8300_2F_JUN23: PaperConfig = {
  id: 'aqa-8300-2f-jun23',
  title: 'AQA GCSE Mathematics 8300/2F',
  subtitle: 'Foundation Tier Paper 2 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'static number-line diagram supported' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '2',   label: '2',     marks: 4,  topic: 'algebra',  skill: 'Simplifying Expressions',                                                  skillIds: ['simplifying_expressions'], kind: 'mastery', visual: false, desc: 'expression-to-expression matching; needs a pairing input' },
    { id: '3a',  label: '3(a)',  marks: 2,  topic: 'shape',    skill: 'Lengths and Perimeters',                                                   skillIds: ['lengths_and_perimeters'], kind: 'mastery', visual: false, desc: 'choice credited only with both perimeters shown' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                                                skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '3c',  label: '3(c)',  marks: 1,  topic: 'shape',    skill: 'Areas of Compound Shapes',                                                 skillIds: ['areas_of_compound_shapes'], kind: 'mastery', visual: false, desc: 'two-letter answer, order-insensitive' },
    { id: '3d',  label: '3(d)',  marks: 2,  topic: 'shape',    skill: 'Reflections',                                                              skillIds: ['reflections'], kind: 'mastery', visual: true, desc: 'requires drawing a reflected shape and its mirror line on a grid' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                              skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '4b',  label: '4(b)',  marks: 1,  topic: 'shape',    skill: 'Coordinates',                                                              skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'open answer: several coordinates satisfy the right angle, so exact-match fails' },
    { id: '5a',  label: '5(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic + Converting Measurements',                              skillIds: ['simple_arithmetic', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '5b',  label: '5(b)',  marks: 4,  topic: 'number',   skill: 'Percentage Change + Proportion',                                           skillIds: ['percentage_change', 'proportion'], kind: 'exam', visual: false, desc: 'choice credited only with two comparable totals shown' },
    { id: '6',   label: '6',     marks: 2,  topic: 'probdata', skill: 'Systematic Listing',                                                       skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'requires structured listing with set-equality marking' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'open answer set graded against several simultaneous conditions' },
    { id: '7b',  label: '7(b)',  marks: 2,  topic: 'number',   skill: 'Factors and Multiples',                                                    skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'open answer set graded against several simultaneous conditions' },
    { id: '7c',  label: '7(c)',  marks: 2,  topic: 'number',   skill: 'Indices + Factors and Multiples',                                          skillIds: ['indices', 'factors_and_multiples'], kind: 'mastery', visual: false, desc: 'open answer set graded against several simultaneous conditions' },
    { id: '8a',  label: '8(a)',  marks: 3,  topic: 'probdata', skill: 'Frequency Trees + Fractions Decimals and Percentages',                     skillIds: ['frequency_trees', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'frequency-tree multi-cell entry' },
    { id: '8b',  label: '8(b)',  marks: 2,  topic: 'probdata', skill: 'Calculating Simple Probability',                                           skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '9b',  label: '9(b)',  marks: 3,  topic: 'number',   skill: 'Time Calculations',                                                        skillIds: ['time_calculations'], kind: 'mastery', visual: false, desc: 'two-blank hours-and-minutes answer' },
    { id: '10a', label: '10(a)', marks: 2,  topic: 'number',   skill: 'Fractions of Amounts',                                                     skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '10b', label: '10(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                                                    skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '10c', label: '10(c)', marks: 2,  topic: 'number',   skill: 'Fractions Decimals and Percentages',                                       skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: '' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'probdata', skill: 'Venn Diagrams',                                                            skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'Venn multi-cell entry' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'probdata', skill: 'Venn Diagrams + Calculating Simple Probability',                           skillIds: ['venn_diagrams', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '11c', label: '11(c)', marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                                                        skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'spot-the-error free text; not markable' },
    { id: '12',  label: '12',    marks: 2,  topic: 'ratio',    skill: 'Simplifying Ratio + Ratio',                                                skillIds: ['simplifying_ratio', 'ratio'], kind: 'mastery', visual: false, desc: 'tick + worded reasons for both claims; not markable' },
    { id: '13',  label: '13',    marks: 4,  topic: 'number',   skill: 'Percentage Change',                                                        skillIds: ['percentage_change'], kind: 'mastery', visual: false, desc: 'choice credited only with both values shown' },
    { id: '14',  label: '14',    marks: 1,  topic: 'algebra',  skill: 'Factorising',                                                              skillIds: ['factorising'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '15',  label: '15',    marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                                             skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'list-of-integers answer; needs set-equality marking' },
    { id: '16',  label: '16',    marks: 2,  topic: 'algebra',  skill: 'Finding the nth Term',                                                     skillIds: ['finding_the_nth_term'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '17',  label: '17',    marks: 4,  topic: 'ratio',    skill: 'Ratio + Simplifying Ratio + Simple Arithmetic',                            skillIds: ['ratio', 'simplifying_ratio', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'ratio answer needs simplest-form equivalence check' },
    { id: '18a', label: '18(a)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                             skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'multi-blank table entry' },
    { id: '18b', label: '18(b)', marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                           skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '18c', label: '18(c)', marks: 2,  topic: 'probdata', skill: 'Expected Outcomes',                                                        skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: '' },
    { id: '19a', label: '19(a)', marks: 2,  topic: 'shape',    skill: 'Angles in Polygons',                                                       skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '19b', label: '19(b)', marks: 1,  topic: 'shape',    skill: 'Angles in Polygons',                                                       skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '20',  label: '20',    marks: 2,  topic: 'shape',    skill: 'Translations + Vectors',                                                   skillIds: ['translations', 'vectors'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '21',  label: '21',    marks: 4,  topic: 'shape',    skill: 'Volume of a Sphere + Compound Units + Fractions Decimals and Percentages', skillIds: ['volume_of_a_sphere', 'compound_units', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'yes-no decision credited only with the two comparable volumes shown' },
    { id: '22',  label: '22',    marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                                skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'show-that requires the equal ratios to be evidenced, not just asserted' },
    { id: '23',  label: '23',    marks: 2,  topic: 'ratio',    skill: 'Compound Units + Forming Expressions and Formulae',                        skillIds: ['compound_units', 'forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'algebraic show-that; the target expression is given so only the working scores' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
