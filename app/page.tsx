'use client'

import { useState } from 'react'
import { validateSkills } from '../lib/diagnostic/validateSkills'
import StartScreen from '../components/diagnostic/StartScreen'
import DiagnosticSession from '../components/diagnostic/DiagnosticSession'

validateSkills()

export default function Home() {
  const [courseId, setCourseId] = useState<string | null>(null)

  if (!courseId) {
    return <StartScreen startDiagnostic={(id) => setCourseId(id)} />
  }

  return <DiagnosticSession courseId={courseId} />
}