'use client'

import ExamRunner from '../../../components/exam/ExamRunner'

// Student-facing mini-exam: a monthly free allowance (unlimited when paid),
// enforced server-side by /api/exam/quota, with answers recorded to the skill
// map. Shares the runner with the teacher preview at /dashboard/exam.
export default function StudentExamPage() {
  return <ExamRunner variant="student" />
}
