// Tri-state calculator flag carried by every question row (DB column
// `questions.calculator`, default 'na'). Single source of truth for the type
// and its human labels so the admin form and the later paper-assembly logic
// agree. See migration 20260607_question_calculator_flag.sql for semantics.

export type CalculatorMode = 'calc' | 'non_calc' | 'na'

export const CALCULATOR_MODES: CalculatorMode[] = ['na', 'non_calc', 'calc']

export const CALCULATOR_LABELS: Record<CalculatorMode, string> = {
  na: 'N/A — calculator irrelevant',
  non_calc: 'Non-calculator (Paper 1)',
  calc: 'Calculator required',
}

export const DEFAULT_CALCULATOR_MODE: CalculatorMode = 'na'
