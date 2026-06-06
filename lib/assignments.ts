import { supabase } from './supabase'
import { getSession } from './auth'

// ── Types ──────────────────────────────────────────────────────────────────

export type Assignment = {
  id: string
  teacher_id: string
  title: string
  instructions: string | null
  selection_mode: 'picked' | 'pool'
  skill_ids: string[]
  target_count: number | null
  completion_mode: 'attempt_once' | 'until_correct' | 'mastery_based'
  due_at: string | null
  created_at: string
}

export type AssignmentQuestion = {
  id: string
  assignment_id: string
  question_id: string
  position: number
  // joined question fields (select with questions(*))
  questions?: {
    id: string
    skill_ids: string[]
    difficulty: number
    question_template: string
    question_type: string
  }
}

export type AssignmentResult = {
  student_id: string
  display_name: string
  year_group: string | null
  total_attempts: number
  correct_count: number
  questions_started: number
  is_complete: boolean
  score: string | null
  last_attempt_at: string | null
}

export type AssignmentAttempt = {
  id: string
  assignment_id: string
  student_id: string
  question_id: string
  correct: boolean
  attempted_at: string
}

// ── Teacher helpers ────────────────────────────────────────────────────────

/** Creates an assignment with questions and targets in one API call. */
export async function createAssignment(payload: {
  title: string
  instructions: string
  selectionMode: 'picked' | 'pool'
  skillIds: string[]
  targetCount: number
  completionMode: 'attempt_once' | 'until_correct' | 'mastery_based'
  dueAt: string
  pickedQuestionIds: string[]
  targetClassIds: string[]
  targetStudentIds: string[]
}): Promise<Assignment> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch('/api/assignments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.assignment) throw new Error(json?.error ?? 'Failed to create assignment')
  return json.assignment
}

/** Returns all assignments created by the signed-in teacher, newest first. */
export async function getTeacherAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Assignment[]
}

/** Returns the assignment + its questions (teacher or student). */
export async function getAssignment(id: string): Promise<Assignment | null> {
  const { data } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()
  return (data as Assignment) ?? null
}

/** Returns the assignment questions in position order (teacher or student). */
export async function getAssignmentQuestions(assignmentId: string): Promise<AssignmentQuestion[]> {
  const { data } = await supabase
    .from('assignment_questions')
    .select('*, questions(id, skill_ids, difficulty, question_template, question_type)')
    .eq('assignment_id', assignmentId)
    .order('position', { ascending: true })
  return (data ?? []) as AssignmentQuestion[]
}

/** Returns per-student results for a teacher's assignment. */
export async function getAssignmentResults(
  assignmentId: string,
): Promise<{ results: AssignmentResult[]; assignedCount: number; completionMode: string }> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')
  const res = await fetch(`/api/assignments/${assignmentId}/results`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? 'Failed to load results')
  return json
}

// ── Student helpers ────────────────────────────────────────────────────────

/** Returns all assignments the signed-in student is targeted by. */
export async function getStudentAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Assignment[]
}

/** Returns this student's attempts for a given assignment. */
export async function getMyAttempts(assignmentId: string): Promise<AssignmentAttempt[]> {
  const { data } = await supabase
    .from('assignment_attempts')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('attempted_at', { ascending: true })
  return (data ?? []) as AssignmentAttempt[]
}

/**
 * Records a student attempt on an assigned question.
 * Written directly (RLS: auth.uid() = student_id AND student_has_assignment).
 * Also written to practice_attempts (via the practice question page) for
 * skill/mastery tracking — this function only handles the assignment record.
 */
export async function recordAssignmentAttempt(params: {
  assignmentId: string
  questionId: string
  skillIds: string[]
  correct: boolean
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // anonymous — can't record
  await supabase.from('assignment_attempts').insert({
    assignment_id: params.assignmentId,
    student_id:    user.id,
    question_id:   params.questionId,
    correct:       params.correct,
  })
}
