import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Which investigations a signed-in student has finished.
//
// A record that they pressed Finish — NOT mastery, which investigations never
// write (docs/audit/31 §8). See supabase/migrations/20261124_investigation_
// completions.sql for why it exists and docs/audit/32 D3 for what reads it.
//
// Both calls fail soft. Nothing a student is doing should stop because this
// table could not be read or written: the worst case is the wrong-answer card
// offering an investigation they have already done, which is what happened
// before the table existed.
// ─────────────────────────────────────────────────────────────────────────────

/** Records that `studentId` finished the investigation on `skillId`. The first time only. */
export async function recordInvestigationCompletion(studentId: string, skillId: string): Promise<void> {
  const { error } = await supabase
    .from('investigation_completions')
    .upsert(
      { student_id: studentId, skill_id: skillId },
      // ON CONFLICT DO NOTHING: finishing again keeps the first completion,
      // and needs no UPDATE privilege, which the table does not grant.
      { onConflict: 'student_id,skill_id', ignoreDuplicates: true },
    )
  if (error) console.warn('investigation completion not recorded:', error.message)
}

/** The skills whose investigation `studentId` has finished, most recent first. Empty on any failure. */
export async function finishedInvestigations(studentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('investigation_completions')
    .select('skill_id, completed_at')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false })
  if (error) {
    console.warn('investigation completions not read:', error.message)
    return []
  }
  return (data ?? []).map(r => r.skill_id as string)
}
