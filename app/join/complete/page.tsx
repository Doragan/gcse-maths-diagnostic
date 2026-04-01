'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { skillsById } from '../../../lib/skills/skillGraph'
import ResultsView from '../../../components/results/ResultsView'
import { getPrerequisiteTree } from '../../../lib/skills/skillGraph'
import { colors, font } from '../../../lib/styles'

export default function CompletePage() {
  const router = useRouter()
  const [props, setProps] = useState<any>(null)

  useEffect(() => {
    const masteredIds: string[] = JSON.parse(sessionStorage.getItem('student_mastered') ?? '[]')
    const needsIds: string[] = JSON.parse(sessionStorage.getItem('student_needs_practice') ?? '[]')
    const studentName = sessionStorage.getItem('student_name_display') ?? undefined

    const allDiagnosed = new Set([...masteredIds, ...needsIds])
    const allSkillIds = Object.keys(skillsById)
    const untestedIds = allSkillIds.filter(id => !allDiagnosed.has(id))

    const mastered = new Set(masteredIds)
    const needsPractice = new Set(needsIds)
    const untested = new Set(untestedIds)

    // Build topicSkills map
    const topicSkills: Record<string, string[]> = {}
    allSkillIds.forEach(id => {
      const skill = skillsById[id]
      if (!skill) return
      if (!topicSkills[skill.topic]) topicSkills[skill.topic] = []
      topicSkills[skill.topic].push(id)
    })

    // Recommendations: needs_practice skills with fewest prerequisites
    const recommendations = needsIds
      .map(id => ({ id, depth: getPrerequisiteTree(id).length }))
      .sort((a, b) => a.depth - b.depth)
      .slice(0, 3)
      .map(r => r.id)

    const masteredCount = masteredIds.length
    const totalSkills = masteredIds.length + needsIds.length
    const masteryPercent = totalSkills > 0 ? Math.round((masteredCount / totalSkills) * 100) : 0

    setProps({
      masteryPercent,
      masteredCount,
      totalSkills,
      mastered,
      needsPractice,
      untested,
      topicSkills,
      recommendations,
      studentName,
    })
  }, [])

  if (!props) {
    return (
      <main style={{ padding: '40px 20px', textAlign: 'center' as const }}>
        <p style={{ color: colors.textSecondary, fontSize: font.base }}>Loading your results...</p>
      </main>
    )
  }

  return <ResultsView {...props} />
}