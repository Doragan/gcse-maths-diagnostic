import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/2H — Higher Tier Paper 2 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/JUN23-H-P2.json by
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
export const AQA_8300_2H_JUN23: PaperConfig = {
  id: 'aqa-8300-2h-jun23',
  title: 'AQA GCSE Mathematics 8300/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',   label: '1',     marks: 1,  topic: 'ratio',    skill: 'Simplifying Ratio',                                                                skillIds: ['simplifying_ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence check' },
    { id: '2',   label: '2',     marks: 1,  topic: 'algebra',  skill: 'Sequences',                                                                        skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '3',   label: '3',     marks: 1,  topic: 'number',   skill: 'Reciprocals',                                                                      skillIds: ['reciprocals'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '4',   label: '4',     marks: 2,  topic: 'ratio',    skill: 'Reverse Percentage',                                                               skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: '' },
    { id: '5',   label: '5',     marks: 4,  topic: 'ratio',    skill: 'Ratio + Simplifying Ratio + Simple Arithmetic',                                    skillIds: ['ratio', 'simplifying_ratio', 'simple_arithmetic'], kind: 'mastery', visual: false, desc: 'ratio answer needs simplest-form equivalence check' },
    { id: '6a',  label: '6(a)',  marks: 2,  topic: 'shape',    skill: 'Angles in Polygons',                                                               skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'shape',    skill: 'Angles in Polygons',                                                               skillIds: ['angles_in_polygons'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '7a',  label: '7(a)',  marks: 2,  topic: 'algebra',  skill: 'Substitution',                                                                     skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'multi-blank table entry' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'probdata', skill: 'Calculating Simple Probability',                                                   skillIds: ['calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '7c',  label: '7(c)',  marks: 2,  topic: 'probdata', skill: 'Expected Outcomes',                                                                skillIds: ['expected_outcomes'], kind: 'mastery', visual: false, desc: '' },
    { id: '8',   label: '8',     marks: 2,  topic: 'algebra',  skill: 'Equations and Identities',                                                         skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'two-blank answer; values must be evaluated, not left embedded' },
    { id: '9',   label: '9',     marks: 4,  topic: 'shape',    skill: 'Coordinates',                                                                      skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'two coordinate pairs in one part; needs a multi-blank pair-equivalence response' },
    { id: '10',  label: '10',    marks: 2,  topic: 'shape',    skill: 'Translations + Vectors',                                                           skillIds: ['translations', 'vectors'], kind: 'mastery', visual: false, desc: 'column-vector entry; needs vector-form input/check' },
    { id: '11',  label: '11',    marks: 4,  topic: 'shape',    skill: 'Volume of a Sphere + Compound Units + Fractions Decimals and Percentages',         skillIds: ['volume_of_a_sphere', 'compound_units', 'fractions_decimals_and_percentages'], kind: 'exam', visual: false, desc: 'yes-no decision credited only with the two comparable volumes shown' },
    { id: '12',  label: '12',    marks: 2,  topic: 'shape',    skill: 'Congruence and Similarity',                                                        skillIds: ['congruence_and_similarity'], kind: 'mastery', visual: false, desc: 'show-that requires the equal ratios to be evidenced, not just asserted' },
    { id: '13',  label: '13',    marks: 2,  topic: 'ratio',    skill: 'Compound Units + Forming Expressions and Formulae',                                skillIds: ['compound_units', 'forming_expressions_and_formulae'], kind: 'mastery', visual: false, desc: 'algebraic show-that; the target expression is given so only the working scores' },
    { id: '14a', label: '14(a)', marks: 3,  topic: 'probdata', skill: 'Grouped Frequency Tables + Fractions Decimals and Percentages',                    skillIds: ['grouped_frequency_tables', 'fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'show-that on a claim about a grouped table; the supporting count must be evidenced' },
    { id: '14b', label: '14(b)', marks: 1,  topic: 'probdata', skill: 'Grouped Frequency Tables',                                                         skillIds: ['grouped_frequency_tables'], kind: 'mastery', visual: false, desc: 'worded critique of grouped-data assumptions; not markable' },
    { id: '14c', label: '14(c)', marks: 3,  topic: 'probdata', skill: 'Grouped Frequency Tables + Mean',                                                  skillIds: ['grouped_frequency_tables', 'mean'], kind: 'mastery', visual: false, desc: '' },
    { id: '14d', label: '14(d)', marks: 1,  topic: 'probdata', skill: 'Mean + Median',                                                                    skillIds: ['mean', 'median'], kind: 'mastery', visual: false, desc: 'worded reason about skew and outliers; not markable' },
    { id: '15',  label: '15',    marks: 2,  topic: 'algebra',  skill: 'Expanding Double Brackets',                                                        skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '16',  label: '16',    marks: 3,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Rearranging Formulae (Changing the Subject)', skillIds: ['understanding_straight_line_graphs', 'rearranging_formulae'], kind: 'exam', visual: false, desc: 'show-that comparing two gradients; both must be evidenced' },
    { id: '17',  label: '17',    marks: 4,  topic: 'shape',    skill: 'Trigonometry (missing sides) + Trigonometry (missing angles)',                     skillIds: ['trigonometry_missing_sides', 'trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'static diagram supported; answer accepted over a rounding range' },
    { id: '18',  label: '18',    marks: 3,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject) + Algebraic Fractions',                skillIds: ['rearranging_formulae', 'algebraic_fractions'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '19',  label: '19',    marks: 4,  topic: 'algebra',  skill: 'Nth Term of Quadratic Sequences',                                                  skillIds: ['nth_term_quadratic_sequences'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '20a', label: '20(a)', marks: 1,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre',                                                  skillIds: ['circle_theorem_angle_at_centre'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '20b', label: '20(b)', marks: 1,  topic: 'shape',    skill: 'Circle Theorem: Angle at Centre',                                                  skillIds: ['circle_theorem_angle_at_centre'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '20c', label: '20(c)', marks: 1,  topic: 'shape',    skill: 'Circle Theorem: Alternate Segment',                                                skillIds: ['circle_theorem_alternate_segment'], kind: 'mastery', visual: false, desc: 'spot-the-error in a worked argument; not markable' },
    { id: '21',  label: '21',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                                 skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: '' },
    { id: '22a', label: '22(a)', marks: 2,  topic: 'algebra',  skill: 'Iteration',                                                                        skillIds: ['iteration'], kind: 'mastery', visual: false, desc: 'two values in one part; needs a two-blank response' },
    { id: '22b', label: '22(b)', marks: 1,  topic: 'algebra',  skill: 'Iteration',                                                                        skillIds: ['iteration'], kind: 'mastery', visual: false, desc: 'any value in the converged range is accepted' },
    { id: '23',  label: '23',    marks: 4,  topic: 'probdata', skill: 'Combined Events + Conditional Probability + Calculating Simple Probability',       skillIds: ['combined_events', 'conditional_probability', 'calculating_simple_probability'], kind: 'mastery', visual: false, desc: 'choice credited only with two comparable probabilities shown' },
    { id: '24',  label: '24',    marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds',                                                           skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: '' },
    { id: '25',  label: '25',    marks: 3,  topic: 'algebra',  skill: 'Algebraic Fractions + Expanding Double Brackets',                                  skillIds: ['algebraic_fractions', 'expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'algebraic show-that; the target form is given so only the working scores' },
    { id: '26a', label: '26(a)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                            skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '26b', label: '26(b)', marks: 1,  topic: 'algebra',  skill: 'Graph Transformations',                                                            skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'algebraic answer needs equivalence checker' },
    { id: '26c', label: '26(c)', marks: 2,  topic: 'algebra',  skill: 'Graph Transformations',                                                            skillIds: ['graph_transformations'], kind: 'mastery', visual: false, desc: 'describe-fully answer combines a name and a vector in free text' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
