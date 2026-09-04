import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/1H — Higher Tier Paper 1 Non-calculator — November 2024.
 *
 * GENERATED from data/exam-audit/NOV24-H-P1.json by
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
export const AQA_8300_1H_NOV24: PaperConfig = {
  id: 'aqa-8300-1h-nov24',
  title: 'AQA GCSE Mathematics 8300/1H',
  subtitle: 'Higher Tier Paper 1 Non-calculator — November 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 2,  topic: 'number',   skill: 'Indices + Decimals',                                                  skillIds: ['indices', 'decimals'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '2a',  label: '2(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                   skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'completing a sequence of operation boxes in a machine; not a single answer type' },
    { id: '2b',  label: '2(b)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                   skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'single numeric value into the machine' },
    { id: '2c',  label: '2(c)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                                   skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'operation-box entry in a machine; not a single numeric answer' },
    { id: '3',   label: '3',     marks: 3,  topic: 'probdata', skill: 'Mode + Median + Range',                                               skillIds: ['mode', 'median', 'range'], kind: 'mastery', visual: false, desc: 'three true/false/cannot-tell row selections' },
    { id: '4a',  label: '4(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                           skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'single numeric term' },
    { id: '4b',  label: '4(b)',  marks: 2,  topic: 'algebra',  skill: 'Sequences',                                                           skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'two numeric terms' },
    { id: '5a',  label: '5(a)',  marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                                             skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'single numeric count; solid shown as image' },
    { id: '5b',  label: '5(b)',  marks: 2,  topic: 'shape',    skill: 'Volume of a prism',                                                   skillIds: ['volume_of_a_prism'], kind: 'mastery', visual: false, desc: 'single numeric area' },
    { id: '6',   label: '6',     marks: 2,  topic: 'number',   skill: 'Adding and Subtracting Fractions + Irregular and Improper Fractions', skillIds: ['adding_and_subtracting_fractions', 'irregular_and_improper_fractions'], kind: 'mastery', visual: false, desc: 'single clean fraction answer' },
    { id: '7',   label: '7',     marks: 4,  topic: 'shape',    skill: 'Area of a Circle',                                                    skillIds: ['area_of_a_circle'], kind: 'mastery', visual: false, desc: 'answer is an exact \'in terms of pi\' value; needs pi-symbolic equivalence checking' },
    { id: '8a',  label: '8(a)',  marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion',                                                  skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '8b',  label: '8(b)',  marks: 1,  topic: 'ratio',    skill: 'Inverse Proportion',                                                  skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'tick a fixed conclusion; the choice is the whole answer' },
    { id: '9',   label: '9',     marks: 3,  topic: 'algebra',  skill: 'Solving Linear Equations + Adding and Subtracting Fractions',         skillIds: ['solving_linear_equations', 'adding_and_subtracting_fractions'], kind: 'exam', visual: false, desc: 'two numeric values (a and b)' },
    { id: '10',  label: '10',    marks: 4,  topic: 'probdata', skill: 'Venn Diagrams',                                                       skillIds: ['venn_diagrams'], kind: 'mastery', visual: false, desc: 'entering numbers into specific Venn regions needs a region-aware input' },
    { id: '11',  label: '11',    marks: 3,  topic: 'shape',    skill: 'Loci + Constructions',                                                skillIds: ['loci', 'constructions'], kind: 'mastery', visual: true, desc: 'constructing a locus region needs compass/measurement drawing input' },
    { id: '12a', label: '12(a)', marks: 2,  topic: 'number',   skill: 'Converting Fractions to Decimals',                                    skillIds: ['converting_fractions_to_decimals'], kind: 'mastery', visual: false, desc: 'recurring-decimal answer is notation-sensitive (dot notation) - needs a recurring-decimal checker' },
    { id: '12b', label: '12(b)', marks: 3,  topic: 'number',   skill: 'Recurring Decimals to Fractions',                                     skillIds: ['recurring_decimals_to_fractions'], kind: 'mastery', visual: false, desc: 'single clean fraction answer' },
    { id: '13a', label: '13(a)', marks: 3,  topic: 'shape',    skill: 'Cosine Rule',                                                         skillIds: ['cosine_rule'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '13b', label: '13(b)', marks: 2,  topic: 'shape',    skill: 'Cosine Rule',                                                         skillIds: ['cosine_rule'], kind: 'mastery', visual: false, desc: 'identifying errors in given working is free-text critique, not markable by answer-matching' },
    { id: '14',  label: '14',    marks: 3,  topic: 'shape',    skill: 'Enlargements + Fractional and Negative Enlargements',                 skillIds: ['enlargements', 'fractional_enlargements'], kind: 'mastery', visual: true, desc: 'drawing an enlarged image on a grid needs a plotting input' },
    { id: '15a', label: '15(a)', marks: 3,  topic: 'algebra',  skill: 'Inequalities',                                                        skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'inequality answer needs a solution-set / inequality-equivalence checker' },
    { id: '15b', label: '15(b)', marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                                        skillIds: ['inequalities'], kind: 'mastery', visual: true, desc: 'drawing an inequality on a number line needs a number-line input' },
    { id: '16',  label: '16',    marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                              skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'half the credit is a worded reason about truncation; not markable by answer-matching' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'algebra',  skill: 'Equation of a Circle',                                                skillIds: ['equation_of_a_circle'], kind: 'mastery', visual: false, desc: 'circle equation answer needs an algebraic-equivalence checker' },
    { id: '17b', label: '17(b)', marks: 4,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs',                                  skillIds: ['understanding_straight_line_graphs'], kind: 'mastery', visual: false, desc: 'line equation answer needs an algebraic-equivalence checker (y=-x/3+5 oe)' },
    { id: '18a', label: '18(a)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square',                                               skillIds: ['completing_the_square'], kind: 'mastery', visual: false, desc: 'completed-square form needs an algebraic-equivalence checker' },
    { id: '18b', label: '18(b)', marks: 2,  topic: 'algebra',  skill: 'Completing the Square + Graph Transformations',                       skillIds: ['completing_the_square', 'graph_transformations'], kind: 'exam', visual: false, desc: 'coordinate-pair answer needs a coordinate-equivalence checker' },
    { id: '19a', label: '19(a)', marks: 3,  topic: 'algebra',  skill: 'Expanding Double Brackets + Simplifying Expressions',                 skillIds: ['expanding_double_brackets', 'simplifying_expressions'], kind: 'mastery', visual: false, desc: 'cubic expansion needs an algebraic-equivalence checker' },
    { id: '19b', label: '19(b)', marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                        skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'single numeric answer' },
    { id: '20a', label: '20(a)', marks: 2,  topic: 'number',   skill: 'Simplifying Surds',                                                   skillIds: ['surds_simplifying'], kind: 'mastery', visual: false, desc: 'show-that to an integer requires marking the surd manipulation, not just the value' },
    { id: '20b', label: '20(b)', marks: 2,  topic: 'number',   skill: 'Expanding and Rationalising Surds',                                   skillIds: ['surds_expanding_and_rationalising'], kind: 'mastery', visual: false, desc: 'surd answer needs a surd-equivalence checker' },
    { id: '21a', label: '21(a)', marks: 1,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                skillIds: ['trig_graphs'], kind: 'mastery', visual: false, desc: 'single numeric angle' },
    { id: '21b', label: '21(b)', marks: 2,  topic: 'algebra',  skill: 'Trigonometric Graphs',                                                skillIds: ['trig_graphs'], kind: 'mastery', visual: false, desc: 'two numeric angles' },
    { id: '22',  label: '22',    marks: 3,  topic: 'number',   skill: 'Simplifying Indices + Indices',                                       skillIds: ['simplifying_indices', 'indices'], kind: 'mastery', visual: false, desc: 'line-matching expressions needs a match/connect UI' },
    { id: '23a', label: '23(a)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                               skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'equation answer needs an algebraic-equivalence checker' },
    { id: '23b', label: '23(b)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                               skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'equation answer needs an algebraic-equivalence checker' },
    { id: '23c', label: '23(c)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                               skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'equation answer needs an algebraic-equivalence checker' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
