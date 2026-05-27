'use client'

import { useState } from 'react'
import { validateSkills } from '../../lib/diagnostic/validateSkills'
import DiagnosticStartScreen from '../../components/diagnostic/DiagnosticStartScreen'
import DiagnosticSession from '../../components/diagnostic/DiagnosticSession'

validateSkills()

export default function DiagnosticPage() {
  const [courseId, setCourseId] = useState<string | null>(null)

  if (!courseId) {
    return <DiagnosticStartScreen onStart={(id) => setCourseId(id)} />
  }

  return <DiagnosticSession courseId={courseId} />
}
