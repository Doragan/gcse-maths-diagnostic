'use client'

import ExamRunner from '../../../components/exam/ExamRunner'

// Teacher-facing mini-exam preview: unlimited papers, nothing recorded. The
// student-facing version (monthly allowance + mastery recording) lives at
// /student/exam; both render the shared runner.
export default function ExamPreviewPage() {
  return <ExamRunner variant="teacher-preview" />
}
