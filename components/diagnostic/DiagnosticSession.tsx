'use client'

import { skillsById } from '../../lib/skills/skillGraph'
import { trackEvent } from '../../lib/analytics'
import { generatePDF } from '../../lib/results/generatePDF'
import { useDiagnostic } from '../../lib/diagnostic/useDiagnostic'
import QuestionScreen from './QuestionScreen'
import ResultsView from '../results/ResultsView'

type Props = {
  courseId: string
}

export default function DiagnosticSession({ courseId }: Props) {
  const {
    diagnostic,
    currentSkill,
    questionsAsked,
    diagnosedSkills,
    courseSkills,
    mastered,
    needsPractice,
    untested,
    totalSkills,
    masteredCount,
    masteryPercent,
    recommendations,
    topicSkills,
    handleAnswer,
    finishDiagnostic,
  } = useDiagnostic(courseId)

  if (!currentSkill) {
    trackEvent('diagnostic_completed')
    return (
      <ResultsView
        masteryPercent={masteryPercent}
        masteredCount={masteredCount}
        totalSkills={totalSkills}
        mastered={mastered}
        needsPractice={needsPractice}
        untested={untested}
        topicSkills={topicSkills}
        recommendations={recommendations}
      />
    )
  }

  return (
    <QuestionScreen
      currentSkill={currentSkill}
      questionsAsked={questionsAsked}
      diagnosedSkills={diagnosedSkills}
      courseSkillsLength={courseSkills.length}
      remainingSkills={diagnostic.remainingSkills.length}
      finishDiagnostic={finishDiagnostic}
      handleAnswer={handleAnswer}
    />
  )
}