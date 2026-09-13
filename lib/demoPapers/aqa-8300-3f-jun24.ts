import type { PaperConfig } from './types'

/**
 * AQA GCSE Mathematics 8300/3F — Foundation Tier Paper 3 Calculator — June 2024.
 *
 * GENERATED from data/exam-audit/JUN24-F-P3.json by
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
export const AQA_8300_3F_JUN24: PaperConfig = {
  id: 'aqa-8300-3f-jun24',
  title: 'AQA GCSE Mathematics 8300/3F',
  subtitle: 'Foundation Tier Paper 3 Calculator — June 2024',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1a',  label: '1(a)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                    skillIds: ['simple_charts'], kind: 'mastery', visual: true, desc: 'requires drawing a bar on a chart' },
    { id: '1b',  label: '1(b)',  marks: 1,  topic: 'probdata', skill: 'Simple Charts',                                    skillIds: ['simple_charts'], kind: 'mastery', visual: false, desc: 'static bar chart supported' },
    { id: '2',   label: '2',     marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'ordering negative numbers; exact sequence checkable' },
    { id: '3a',  label: '3(a)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                        skillIds: ['sequences'], kind: 'mastery', visual: false, desc: '' },
    { id: '3b',  label: '3(b)',  marks: 1,  topic: 'algebra',  skill: 'Sequences',                                        skillIds: ['sequences'], kind: 'mastery', visual: false, desc: 'term-to-term rule worded answer' },
    { id: '4',   label: '4',     marks: 2,  topic: 'number',   skill: 'Simple Arithmetic',                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: 'multiple valid coin combinations; needs set-validity check' },
    { id: '5',   label: '5',     marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages',               skillIds: ['fractions_decimals_and_percentages'], kind: 'mastery', visual: false, desc: 'genuine symbol-select per row' },
    { id: '6a',  label: '6(a)',  marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                          skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: 'static solid diagram supported' },
    { id: '6b',  label: '6(b)',  marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                          skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: '' },
    { id: '6c',  label: '6(c)',  marks: 1,  topic: 'shape',    skill: 'Properties of 3D Solids',                          skillIds: ['properties_of_3d_solids'], kind: 'mastery', visual: false, desc: '' },
    { id: '7a',  label: '7(a)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: '' },
    { id: '7b',  label: '7(b)',  marks: 1,  topic: 'algebra',  skill: 'Function Machines',                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'multiple equivalent operations accepted' },
    { id: '7c',  label: '7(c)',  marks: 2,  topic: 'algebra',  skill: 'Function Machines',                                skillIds: ['function_machines'], kind: 'mastery', visual: false, desc: 'multiple equivalent operation pairs accepted' },
    { id: '8',   label: '8',     marks: 3,  topic: 'number',   skill: 'Fractions Decimals and Percentages + Proportion',  skillIds: ['fractions_decimals_and_percentages', 'proportion'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '9',   label: '9',     marks: 2,  topic: 'number',   skill: 'Indices',                                          skillIds: ['indices'], kind: 'mastery', visual: false, desc: '' },
    { id: '10',  label: '10',    marks: 5,  topic: 'probdata', skill: 'Frequency Trees',                                  skillIds: ['frequency_trees'], kind: 'mastery', visual: false, desc: 'frequency-tree multi-cell entry' },
    { id: '11a', label: '11(a)', marks: 1,  topic: 'shape',    skill: 'Coordinates',                                      skillIds: ['coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '11b', label: '11(b)', marks: 1,  topic: 'shape',    skill: 'Reflections + Coordinates',                        skillIds: ['reflections', 'coordinates'], kind: 'mastery', visual: false, desc: 'coordinate answer needs pair-equivalence checker' },
    { id: '12a', label: '12(a)', marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                   skillIds: ['scatter_graphs'], kind: 'mastery', visual: true, desc: 'requires plotting points + axis label' },
    { id: '12b', label: '12(b)', marks: 2,  topic: 'probdata', skill: 'Scatter Graphs',                                   skillIds: ['scatter_graphs'], kind: 'mastery', visual: false, desc: 'describe-correlation worded answer' },
    { id: '13',  label: '13',    marks: 3,  topic: 'shape',    skill: 'Angles on lines and Circles + Angles in Polygons', skillIds: ['angles_on_lines_and_circles', 'angles_in_polygons'], kind: 'mastery', visual: false, desc: 'tick yes/no + supporting angle values; decision not markable' },
    { id: '14',  label: '14',    marks: 2,  topic: 'algebra',  skill: 'Expanding Brackets',                               skillIds: ['expanding_brackets'], kind: 'mastery', visual: false, desc: 'expression answer needs equivalence checker' },
    { id: '15',  label: '15',    marks: 3,  topic: 'algebra',  skill: 'Simplifying Expressions + Simplifying Indices',    skillIds: ['simplifying_expressions', 'simplifying_indices'], kind: 'mastery', visual: false, desc: 'expression answers need equivalence checker' },
    { id: '16',  label: '16',    marks: 5,  topic: 'ratio',    skill: 'Proportion + Percentage Change',                   skillIds: ['proportion', 'percentage_change'], kind: 'exam', visual: false, desc: 'choose shop + state difference; decision not markable' },
    { id: '17a', label: '17(a)', marks: 2,  topic: 'ratio',    skill: 'Ratio',                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence checker' },
    { id: '17b', label: '17(b)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'fraction answer needs equivalence checker' },
    { id: '17c', label: '17(c)', marks: 1,  topic: 'ratio',    skill: 'Ratio',                                            skillIds: ['ratio'], kind: 'mastery', visual: false, desc: 'ratio answer needs equivalence checker' },
    { id: '18a', label: '18(a)', marks: 1,  topic: 'algebra',  skill: 'Sequences',                                        skillIds: ['sequences'], kind: 'mastery', visual: true, desc: 'requires drawing the next pattern on a grid' },
    { id: '18b', label: '18(b)', marks: 1,  topic: 'algebra',  skill: 'Substitution',                                     skillIds: ['substitution'], kind: 'mastery', visual: false, desc: 'unique integer answer; exact-match ok' },
    { id: '19',  label: '19',    marks: 3,  topic: 'shape',    skill: 'Pythagoras\' Theorem',                             skillIds: ['pythagoras_theorem'], kind: 'mastery', visual: false, desc: 'static diagram supported' },
    { id: '20',  label: '20',    marks: 1,  topic: 'probdata', skill: 'Sampling',                                         skillIds: ['sampling'], kind: 'mastery', visual: false, desc: 'worded reason not markable' },
    { id: '21',  label: '21',    marks: 1,  topic: 'algebra',  skill: 'Equations and Identities',                         skillIds: ['equations_and_identities'], kind: 'mastery', visual: false, desc: 'genuine tick-box' },
    { id: '22',  label: '22',    marks: 5,  topic: 'number',   skill: 'Simple Arithmetic',                                skillIds: ['simple_arithmetic'], kind: 'mastery', visual: false, desc: '' },
    { id: '23',  label: '23',    marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                             skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'requires drawing the side elevation on a grid' },
    { id: '24a', label: '24(a)', marks: 5,  topic: 'ratio',    skill: 'Compound Units',                                   skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: '' },
    { id: '24b', label: '24(b)', marks: 1,  topic: 'ratio',    skill: 'Compound Units',                                   skillIds: ['compound_units'], kind: 'mastery', visual: false, desc: 'genuine tick-box comparison' },
    { id: '25',  label: '25',    marks: 4,  topic: 'probdata', skill: 'Pie Charts + Mean',                                skillIds: ['pie_charts', 'mean'], kind: 'exam', visual: false, desc: 'static pie chart + table supported' },
    { id: '26',  label: '26',    marks: 2,  topic: 'ratio',    skill: 'Growth and Decay',                                 skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'show-that justification not markable' },
    { id: '27',  label: '27',    marks: 3,  topic: 'ratio',    skill: 'Compound Units + Proportion',                      skillIds: ['compound_units', 'proportion'], kind: 'exam', visual: false, desc: 'compute densities + choose town; decision not markable' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
