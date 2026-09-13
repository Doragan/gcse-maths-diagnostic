import type { PaperConfig } from './types'

/**
 * Edexcel GCSE Mathematics 1MA1/2H — Higher Tier Paper 2 Calculator — June 2025.
 *
 * GENERATED from data/exam-audit/EDEXCEL-JUN25-H-P2.json by
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
export const EDEXCEL_1MA1_2H_JUN25: PaperConfig = {
  id: 'edexcel-1ma1-2h-jun25',
  title: 'Edexcel GCSE Mathematics 1MA1/2H',
  subtitle: 'Higher Tier Paper 2 Calculator — June 2025',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 2,  topic: 'number',   skill: 'Prime Factor Decomposition',                                       skillIds: ['prime_factor_decomposition'], kind: 'mastery', visual: false, desc: 'write a number as a product of its prime factors' },
    { id: '1b',  label: '1(b)',  marks: 2,  topic: 'number',   skill: 'Lowest Common Multiple',                                           skillIds: ['lowest_common_multiple'], kind: 'mastery', visual: false, desc: 'lowest common multiple of two numbers' },
    { id: '2',   label: '2',     marks: 3,  topic: 'ratio',    skill: 'Ratio',                                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'share an amount in a three-part ratio' },
    { id: '3a',  label: '3(a)',  marks: 4,  topic: 'shape',    skill: 'Areas of Compound Shapes + Area of a Circle + Areas of Triangles', skillIds: ['areas_of_compound_shapes', 'area_of_a_circle', 'areas_of_triangles'], kind: 'exam', visual: false, desc: 'bags needed to cover a triangle with a circle removed, rounding up' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'shape',    skill: 'Areas of Compound Shapes',                                         skillIds: ['areas_of_compound_shapes'], kind: 'mastery', visual: false, desc: 'effect on the number of bags when each bag covers less' },
    { id: '4',   label: '4',     marks: 1,  topic: 'shape',    skill: 'Loci',                                                             skillIds: ['loci'], kind: 'mastery', visual: false, desc: 'explain a mistake in shading the region at least a fixed distance from a point' },
    { id: '5',   label: '5',     marks: 3,  topic: 'ratio',    skill: 'Reverse Percentage',                                               skillIds: ['reverse_percentage'], kind: 'exam', visual: false, desc: 'original amount from a fractional decrease and the new amount' },
    { id: '6',   label: '6',     marks: 5,  topic: 'probdata', skill: 'Mean + Ratio',                                                     skillIds: ['mean', 'ratio'], kind: 'exam', visual: false, desc: 'unknown value in one list, given the ratio between two lists\' means' },
    { id: '7',   label: '7',     marks: 2,  topic: 'shape',    skill: 'Trigonometry (missing angles)',                                    skillIds: ['trigonometry_missing_angles'], kind: 'mastery', visual: false, desc: 'angle in a right-angled triangle from two given sides' },
    { id: '8',   label: '8',     marks: 3,  topic: 'ratio',    skill: 'Compound Units',                                                   skillIds: ['compound_units'], kind: 'exam', visual: false, desc: 'how many items of known density and volume fit under a mass limit' },
    { id: '9',   label: '9',     marks: 2,  topic: 'number',   skill: 'Fractional and Negative Indices + Expanding Brackets',             skillIds: ['fractional_and_negative_indices', 'expanding_brackets'], kind: 'exam', visual: false, desc: 'expand a bracket by a term with a negative index and identify the coefficients' },
    { id: '10',  label: '10',    marks: 2,  topic: 'algebra',  skill: 'Solving Linear Equations',                                         skillIds: ['solving_linear_equations'], kind: 'mastery', visual: false, desc: 'solve a linear equation carrying a fractional term' },
    { id: '11a', label: '11(a)', marks: 2,  topic: 'probdata', skill: 'Tree Diagrams',                                                    skillIds: ['tree_diagrams'], kind: 'mastery', visual: true, desc: 'complete a probability tree for two independent events' },
    { id: '11b', label: '11(b)', marks: 3,  topic: 'probdata', skill: 'Tree Diagrams',                                                    skillIds: ['tree_diagrams'], kind: 'exam', visual: false, desc: 'probability that exactly one of two independent events happens' },
    { id: '12a', label: '12(a)', marks: 3,  topic: 'probdata', skill: 'Box Plots',                                                        skillIds: ['box_plots'], kind: 'mastery', visual: true, desc: 'draw a box plot from a five-figure summary' },
    { id: '12b', label: '12(b)', marks: 1,  topic: 'probdata', skill: 'Box Plots',                                                        skillIds: ['box_plots'], kind: 'mastery', visual: false, desc: 'how many of a population lie between the quartiles' },
    { id: '12c', label: '12(c)', marks: 1,  topic: 'probdata', skill: 'Median',                                                           skillIds: ['median'], kind: 'mastery', visual: false, desc: 'judge a claim about what a median implies about the data values' },
    { id: '13',  label: '13',    marks: 3,  topic: 'algebra',  skill: 'Expanding Double Brackets',                                        skillIds: ['expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'expand a product of three linear brackets into a cubic' },
    { id: '14',  label: '14',    marks: 3,  topic: 'probdata', skill: 'Counting Without Listing',                                         skillIds: ['counting_without_listing'], kind: 'exam', visual: false, desc: 'count the ways of awarding ordered prizes across two separate groups' },
    { id: '15a', label: '15(a)', marks: 4,  topic: 'algebra',  skill: 'Inequalities + Plotting Straight Line Graphs',                     skillIds: ['inequalities', 'plotting_straight_line_graphs'], kind: 'exam', visual: true, desc: 'shade and label the region satisfying four inequalities' },
    { id: '15b', label: '15(b)', marks: 1,  topic: 'algebra',  skill: 'Inequalities',                                                     skillIds: ['inequalities'], kind: 'mastery', visual: false, desc: 'identify the redundant inequality of a set' },
    { id: '16a', label: '16(a)', marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors',                                    skillIds: ['area_and_volume_scale_factors'], kind: 'exam', visual: false, desc: 'length in a pair of similar solids from their volumes' },
    { id: '16b', label: '16(b)', marks: 1,  topic: 'shape',    skill: 'Area and Volume Scale Factors',                                    skillIds: ['area_and_volume_scale_factors'], kind: 'mastery', visual: false, desc: 'exact surface-area multiplier between two similar solids' },
    { id: '17',  label: '17',    marks: 2,  topic: 'algebra',  skill: 'Exponential Graphs',                                               skillIds: ['exponential_graphs'], kind: 'mastery', visual: false, desc: 'constant of an exponential curve from a point with a negative x-coordinate' },
    { id: '18',  label: '18',    marks: 3,  topic: 'ratio',    skill: 'Growth and Decay',                                                 skillIds: ['growth_and_decay'], kind: 'exam', visual: false, desc: 'project a population forwards with a constant multiplier and compare against a bound' },
    { id: '19',  label: '19',    marks: 4,  topic: 'shape',    skill: '3D Trigonometry',                                                  skillIds: ['trigonometry_3d'], kind: 'exam', visual: false, desc: 'angle inside a cuboid, built from two right-angled triangles on its faces' },
    { id: '20',  label: '20',    marks: 5,  topic: 'algebra',  skill: 'Understanding Straight Line Graphs + Ratio',                       skillIds: ['understanding_straight_line_graphs', 'ratio'], kind: 'exam', visual: false, desc: 'point dividing a line segment in a ratio, then a line of given gradient through it' },
    { id: '21',  label: '21',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Inequalities',                                           skillIds: ['quadratic_inequalities'], kind: 'mastery', visual: false, desc: 'solve a quadratic inequality already given in factorised form' },
    { id: '22',  label: '22',    marks: 3,  topic: 'algebra',  skill: 'Equation of a Circle + Translations',                              skillIds: ['equation_of_a_circle', 'translations'], kind: 'exam', visual: true, desc: 'sketch a translated circle, marking its centre and its axis intercepts' },
    { id: '23',  label: '23',    marks: 5,  topic: 'shape',    skill: 'Cosine Rule + Sine Rule',                                          skillIds: ['cosine_rule', 'sine_rule'], kind: 'exam', visual: false, desc: 'angle in a quadrilateral via the cosine rule on one triangle then the sine rule on two others' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
