import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1F — Foundation Tier Paper 1 Non-calculator — June 2024.
 *
 * GENERATED from data/exam-audit/JUN24-F-P1.json by
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
export const AQA_8300_1F_JUN24: PaperConfig = {
  id: 'aqa-8300-1f-jun24',
  title: 'AQA GCSE Mathematics 8300/1F',
  subtitle: 'Foundation Tier Paper 1 Non-calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'number',   skill: 'Converting Measurements',                         skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'number',   skill: 'Converting Measurements',                         skillIds: ['converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '2c',  label: '2(c)',  marks: 2,  topic: 'ratio',    skill: 'Proportion + Converting Measurements',            skillIds: ['proportion', 'converting_measurements'], kind: 'mastery', visual: false, desc: '' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'number',   skill: 'Fractions Decimals and Percentages',              skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'static grid diagram rendered via image_url' },
    { id: '3b',  label: '3(b)',  marks: 2,  topic: 'number',   skill: 'Fractions of Amounts',                            skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '4a',  label: '4(a)',  marks: 2,  topic: 'number',   skill: 'Rounding + Decimals',                             skillIds: ['rounding', 'decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '5a',  label: '5(a)',  marks: 1,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',              skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'identify-parallel from grid; static diagram supported' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'shape',    skill: 'Coordinates + Plotting Straight Line Graphs',     skillIds: ['coordinates', 'plotting_straight_line_graphs'], kind: 'mastery', visual: true, desc: 'requires point-plotting input' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'number',   skill: 'Indices',                                         skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'number',   skill: 'Indices',                                         skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '6c',  label: '6(c)',  marks: 1,  topic: 'number',   skill: 'Indices',                                         skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'probdata', skill: 'Systematic Listing',                              skillIds: ['systematic_listing'], kind: 'mastery', visual: false, desc: 'requires structured listing/table entry with set-equality marking' },
    { id: '7b',  label: '7(b)',  marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'two-quantity combination answer; needs structured equivalence check' },
    { id: '8',   label: '8',     marks: 4,  topic: 'number',   skill: 'Simple Arithmetic + Fractions of Amounts',        skillIds: ['simple_arithmetic', 'fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '9a',  label: '9(a)',  marks: 2,  topic: 'probdata', skill: 'Range + Median',                                  skillIds: ['range', 'median'], kind: 'mastery', visual: false, desc: '' },
    { id: '9b',  label: '9(b)',  marks: 1,  topic: 'probdata', skill: 'Range',                                           skillIds: ['range'], kind: 'mastery', visual: false, desc: 'tick + worded reason referencing range; free-text justify not markable' },
    { id: '10',  label: '10',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                            skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                    skillIds: ['substitution'], kind: 'mastery', visual: false, desc: '' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'algebra',  skill: 'Substitution',                                    skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'show-why-incorrect reasoning not markable' },
    { id: '12',  label: '12',    marks: 2,  topic: 'ratio',    skill: 'Proportion + Fractions Decimals and Percentages', skillIds: ['proportion', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'choice credited only with shown comparable values; justify not markable' },
    { id: '13a', label: '13(a)', marks: 2,  topic: 'ratio',    skill: 'Ratio',                                           skillIds: ['ratio'], kind: 'mastery', visual: false, desc: '' },
    { id: '13b', label: '13(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                           skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '14a', label: '14(a)', marks: 1,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'number',   skill: 'Decimals',                                        skillIds: ['decimals'], kind: 'mastery', visual: false, desc: '' },
    { id: '14c', label: '14(c)', marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '15',  label: '15',    marks: 1,  topic: 'shape',    skill: 'Congruence and Similarity',                       skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '16',  label: '16',    marks: 3,  topic: 'number',   skill: 'Simple Arithmetic',                               skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'genuine 3-way select per row' },
    { id: '17',  label: '17',    marks: 4,  topic: 'algebra',  skill: 'Sequences + Finding the nth Term',                skillIds: ['sequences', 'finding_the_nth_term'], kind: 'mastery', visual: false, desc: '' },
    { id: '18',  label: '18',    marks: 2,  topic: 'shape',    skill: 'Areas of Triangles',                              skillIds: ['areas_of_triangles'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '19',  label: '19',    marks: 1,  topic: 'shape',    skill: 'Vectors + Translations',                          skillIds: ['vectors', 'translations'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '20a', label: '20(a)', marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds',                          skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: '' },
    { id: '20b', label: '20(b)', marks: 1,  topic: 'number',   skill: 'Upper and Lower Bounds',                          skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: '' },
    { id: '21a', label: '21(a)', marks: 2,  topic: 'probdata', skill: 'Time Series',                                     skillIds: ['time_series'], kind: 'mastery', visual: true, desc: 'requires plotting/line-drawing input' },
    { id: '21b', label: '21(b)', marks: 1,  topic: 'probdata', skill: 'Time Series',                                     skillIds: ['time_series'], kind: 'mastery', visual: false, desc: 'range-tolerance answer; exact-match insufficient' },
    { id: '22a', label: '22(a)', marks: 1,  topic: 'shape',    skill: 'Surface Area of a Cone',                          skillIds: ['surface_area_of_a_cone'], kind: 'mastery', visual: false, desc: 'explain-the-error free-text not markable' },
    { id: '22b', label: '22(b)', marks: 2,  topic: 'shape',    skill: 'Area of a Circle',                                skillIds: ['area_of_a_circle'], kind: 'mastery', visual: false, desc: '' },
    { id: '22c', label: '22(c)', marks: 1,  topic: 'shape',    skill: 'Area of a Circle',                                skillIds: ['area_of_a_circle'], kind: 'mastery', visual: false, desc: 'tick + reason; justify not markable' },
    { id: '23',  label: '23',    marks: 3,  topic: 'number',   skill: 'Fractions of Amounts',                            skillIds: ['fractions_of_amounts'], kind: 'mastery', visual: false, desc: '' },
    { id: '24',  label: '24',    marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations',                        skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'clean integer solution; exact-match ok' },
    { id: '25',  label: '25',    marks: 3,  topic: 'number',   skill: 'Simplifying Fractions',                           skillIds: ['simplifying_fractions'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '26a', label: '26(a)', marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                    skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'number-line drawing input' },
    { id: '26b', label: '26(b)', marks: 2,  topic: 'algebra',  skill: 'Inequalities',                                    skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'inequality answer needs equivalence checker' },
    { id: '27',  label: '27',    marks: 3,  topic: 'shape',    skill: 'Enlargements',                                    skillIds: ['enlargements'], kind: 'mastery', visual: false, desc: 'describe-transformation free-text; name+SF+centre components' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
