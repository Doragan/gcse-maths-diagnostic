import type { PaperConfig } from './types'

/**
 * OCR GCSE Mathematics J560/06 — Higher Tier Paper 6 Calculator — June 2023.
 *
 * GENERATED from data/exam-audit/OCR-JUN23-H-P6.json by
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
export const OCR_J560_06_JUN23: PaperConfig = {
  id: 'ocr-j560-06-jun23',
  title: 'OCR GCSE Mathematics J560/06',
  subtitle: 'Higher Tier Paper 6 Calculator — June 2023',

  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'shape', label: 'Shape and Space' },
    { id: 'probdata', label: 'Probability and Data' },
  ],

  questions: [
    { id: '1',     label: '1',       marks: 1,  topic: 'probdata', skill: 'Grouped Frequency Tables',                                             skillIds: ['grouped_frequency_tables'], kind: 'mastery', visual: false, desc: 'criticise a bar chart whose class intervals overlap' },
    { id: '2a',    label: '2(a)',    marks: 2,  topic: 'algebra',  skill: 'Rearranging Formulae (Changing the Subject)',                          skillIds: ['rearranging_formulae'], kind: 'mastery', visual: false, desc: 'change the subject of a formula where the new subject is squared' },
    { id: '2b',    label: '2(b)',    marks: 3,  topic: 'algebra',  skill: 'Substitution + Converting Measurements',                               skillIds: ['substitution', 'converting_measurements'], kind: 'exam', visual: false, desc: 'initial velocity from the rearranged formula, with one value given in kilometres and the rest in metres' },
    { id: '3a',    label: '3(a)',    marks: 3,  topic: 'probdata', skill: 'Relative Frequency + Expected Outcomes',                               skillIds: ['relative_frequency', 'expected_outcomes'], kind: 'exam', visual: false, desc: 'expected count in a population, from a small sample\'s relative frequency' },
    { id: '3b',    label: '3(b)',    marks: 2,  topic: 'probdata', skill: 'Relative Frequency',                                                   skillIds: ['relative_frequency'], kind: 'mastery', visual: false, desc: 'estimate a probability from a larger sample, as a simplified fraction' },
    { id: '3c',    label: '3(c)',    marks: 1,  topic: 'probdata', skill: 'Relative Frequency + Sampling',                                        skillIds: ['relative_frequency', 'sampling'], kind: 'mastery', visual: false, desc: 'explain why the larger sample gives the better estimate' },
    { id: '4a',    label: '4(a)',    marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion + Sketching Functions',                             skillIds: ['inverse_proportion', 'sketching_functions'], kind: 'exam', visual: true, desc: 'sketch an inverse proportion, the curve approaching but not touching either axis' },
    { id: '4b',    label: '4(b)',    marks: 2,  topic: 'ratio',    skill: 'Inverse Proportion',                                                   skillIds: ['inverse_proportion'], kind: 'mastery', visual: false, desc: 'time taken with fewer identical sources, an inverse relationship' },
    { id: '5',     label: '5',       marks: 5,  topic: 'shape',    skill: 'Constructions + Loci',                                                 skillIds: ['constructions', 'loci'], kind: 'mastery', visual: true, desc: 'construct a perpendicular bisector and an angle bisector and mark where the two loci meet' },
    { id: '6a',    label: '6(a)',    marks: 1,  topic: 'ratio',    skill: 'Reverse Percentage',                                                   skillIds: ['reverse_percentage'], kind: 'mastery', visual: false, desc: 'explain why reducing by a percentage does not undo an increase by that percentage' },
    { id: '6b',    label: '6(b)',    marks: 4,  topic: 'ratio',    skill: 'Reverse Percentage + Percentage Change',                               skillIds: ['reverse_percentage', 'percentage_change'], kind: 'mastery', visual: false, desc: 'a middle year\'s value, from a later year\'s value and both years\' percentage increases over a common base' },
    { id: '7a',    label: '7(a)',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions + Substitution',                                   skillIds: ['quadratic_functions', 'substitution'], kind: 'mastery', visual: false, desc: 'show the coefficient of a drawn quadratic, by substituting a point read off the curve' },
    { id: '7b',    label: '7(b)',    marks: 2,  topic: 'algebra',  skill: 'Quadratic Functions',                                                  skillIds: ['quadratic_functions'], kind: 'mastery', visual: false, desc: 'read both solutions of that quadratic equal to a constant off the curve, to 1 decimal place' },
    { id: '8',     label: '8',       marks: 4,  topic: 'shape',    skill: 'Symmetry (Line and Rotational) + Trigonometry (Missing Sides)',        skillIds: ['symmetry', 'trigonometry_missing_sides'], kind: 'exam', visual: false, desc: 'height of one isosceles triangle in a design whose rotational symmetry order fixes its apex angle' },
    { id: '9',     label: '9',       marks: 4,  topic: 'ratio',    skill: 'Ratio + Simultaneous Equations',                                       skillIds: ['ratio', 'simultaneous_equations'], kind: 'exam', visual: false, desc: 'total after a change, from a ratio before and a different ratio after a stated number is removed from one part' },
    { id: '10a',   label: '10(a)',   marks: 1,  topic: 'number',   skill: 'Factors and Multiples',                                                skillIds: ['factors_and_multiples'], kind: 'mastery', visual: false, desc: 'show a two-digit number is not prime by giving a factor pair' },
    { id: '10bi',  label: '10(bi)',  marks: 2,  topic: 'number',   skill: 'Highest Common Factor',                                                skillIds: ['highest_common_factor'], kind: 'mastery', visual: false, desc: 'highest common factor of two numbers given as products of prime factors' },
    { id: '10bii', label: '10(bii)', marks: 2,  topic: 'number',   skill: 'Prime Factor Decomposition + Standard Form',                           skillIds: ['prime_factor_decomposition', 'standard_form'], kind: 'exam', visual: false, desc: 'write a standard-form value as a product of its prime factors' },
    { id: '11',    label: '11',      marks: 5,  topic: 'shape',    skill: 'Area of a Trapezium + Rearranging Formulae (Changing the Subject)',    skillIds: ['area_of_a_trapezium', 'rearranging_formulae'], kind: 'exam', visual: false, desc: 'one parallel side of a trapezium in terms of its area, the other side given only relative to it' },
    { id: '12a',   label: '12(a)',   marks: 2,  topic: 'number',   skill: 'Upper and Lower Bounds',                                               skillIds: ['upper_and_lower_bounds'], kind: 'mastery', visual: false, desc: 'two-blank error interval for a count rounded to the nearest ten' },
    { id: '12b',   label: '12(b)',   marks: 3,  topic: 'number',   skill: 'Upper and Lower Bounds + Volume of a Prism',                           skillIds: ['upper_and_lower_bounds', 'volume_of_a_prism'], kind: 'exam', visual: false, desc: 'show the smallest possible height of a cuboid, choosing the right bound of a volume and two base dimensions' },
    { id: '13ai',  label: '13(ai)',  marks: 3,  topic: 'probdata', skill: 'Histograms',                                                           skillIds: ['histograms'], kind: 'mastery', visual: false, desc: 'count above a value on an unlabelled-axis histogram, the scale fixed by one stated frequency' },
    { id: '13aii', label: '13(aii)', marks: 1,  topic: 'probdata', skill: 'Histograms + Range',                                                   skillIds: ['histograms', 'range'], kind: 'mastery', visual: false, desc: 'explain why taking the full span of the classes overestimates the range of grouped data' },
    { id: '13b',   label: '13(b)',   marks: 4,  topic: 'probdata', skill: 'Box Plots + Median + Interquartile Range',                             skillIds: ['box_plots', 'median', 'interquartile_range'], kind: 'mastery', visual: false, desc: 'two comparisons between a box plot and a distribution given only by its median and IQR, values cited and in context' },
    { id: '14a',   label: '14(a)',   marks: 2,  topic: 'shape',    skill: 'Plans and Elevations',                                                 skillIds: ['plans_and_elevations'], kind: 'mastery', visual: true, desc: 'draw the plan view of a square-based pyramid to a stated scale' },
    { id: '14b',   label: '14(b)',   marks: 5,  topic: 'shape',    skill: 'Volume of a Pyramid and Cone + 3D Trigonometry',                       skillIds: ['volume_of_a_pyramid_and_cone', 'trigonometry_3d'], kind: 'exam', visual: false, desc: 'volume of a square-based pyramid whose perpendicular height must first come from a sloping edge and the base diagonal' },
    { id: '15',    label: '15',      marks: 4,  topic: 'shape',    skill: 'Area and Volume Scale Factors',                                        skillIds: ['area_and_volume_scale_factors'], kind: 'mastery', visual: false, desc: 'height of a similar bottle from two capacities and the other\'s height' },
    { id: '16a',   label: '16(a)',   marks: 1,  topic: 'ratio',    skill: 'Growth and Decay',                                                     skillIds: ['growth_and_decay'], kind: 'mastery', visual: false, desc: 'read the percentage increase straight off a given compound-growth multiplier' },
    { id: '16b',   label: '16(b)',   marks: 2,  topic: 'ratio',    skill: 'Growth and Decay + Substitution',                                      skillIds: ['growth_and_decay', 'substitution'], kind: 'exam', visual: false, desc: 'show a value from that formula at a large index stays below a stated bound' },
    { id: '17',    label: '17',      marks: 4,  topic: 'number',   skill: 'Simplifying Indices + Fractional and Negative Indices',                skillIds: ['simplifying_indices', 'fractional_and_negative_indices'], kind: 'mastery', visual: false, desc: 'the common ratio of a sequence whose sixth term is a stated multiple of its second, to 3 decimal places' },
    { id: '18a',   label: '18(a)',   marks: 3,  topic: 'algebra',  skill: 'Equation of a Circle',                                                 skillIds: ['equation_of_a_circle'], kind: 'mastery', visual: false, desc: 'describe a circle fully from its equation — shape, centre and radius' },
    { id: '18b',   label: '18(b)',   marks: 6,  topic: 'algebra',  skill: 'Simultaneous Equations (Linear and Quadratic) + Equation of a Circle', skillIds: ['simultaneous_equations_quadratic', 'equation_of_a_circle'], kind: 'exam', visual: false, desc: 'both intersection points of a line and a circle centred on the origin, by substitution' },
    { id: '19a',   label: '19(a)',   marks: 1,  topic: 'number',   skill: 'Simplifying Surds',                                                    skillIds: ['surds_simplifying'], kind: 'mastery', visual: false, desc: 'show a product of two surds simplifies to a multiple of one of them' },
    { id: '19b',   label: '19(b)',   marks: 4,  topic: 'number',   skill: 'Expanding and Rationalising Surds + Simplifying Surds',                skillIds: ['surds_expanding_and_rationalising', 'surds_simplifying'], kind: 'mastery', visual: false, desc: 'rationalise a two-term surd denominator to a stated form, using the simplification just shown' },
    { id: '20a',   label: '20(a)',   marks: 5,  topic: 'algebra',  skill: 'Completing the Square + Expanding Double Brackets',                    skillIds: ['completing_the_square', 'expanding_double_brackets'], kind: 'mastery', visual: false, desc: 'complete the square on a non-monic quadratic given as a product of two brackets' },
    { id: '20b',   label: '20(b)',   marks: 2,  topic: 'algebra',  skill: 'Sketching Functions + Quadratic Functions',                            skillIds: ['sketching_functions', 'quadratic_functions'], kind: 'exam', visual: false, desc: 'choose the accurate sketch of that quadratic from three, naming the properties used' },
  ],

  // See the header: both are hand-authored and the audit has no question text.
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
}
