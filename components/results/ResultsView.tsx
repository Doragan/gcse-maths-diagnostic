'use client'

import { useState } from 'react'
import Link from 'next/link'
import { skillsById, getPrerequisiteTree } from '../../lib/skills/skillGraph'
import { trackEvent } from '../../lib/analytics'
import { generatePDF } from '../../lib/results/generatePDF'
import { colors, font, radius, card } from '../../lib/styles'

type Props = {
  masteryPercent: number
  masteredCount: number
  totalSkills: number
  mastered: Set<string>
  needsPractice: Set<string>
  untested: Set<string>
  topicSkills: Record<string, string[]>
  recommendations: string[]
  studentName?: string
}

export default function ResultsView({
  masteryPercent,
  masteredCount,
  totalSkills,
  mastered,
  needsPractice,
  untested,
  topicSkills,
  recommendations,
  studentName,
}: Props) {
  const [openTopics, setOpenTopics] = useState<string[]>([])
  const [copyLabel, setCopyLabel] = useState('📋 Copy results')

  function toggleTopic(topic: string) {
    setOpenTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  // Recommendations sorted by fewest prerequisites (most fundamental first)
  const sortedRecs = [...recommendations]
    .map(id => ({ id, depth: getPrerequisiteTree(id).length }))
    .sort((a, b) => a.depth - b.depth)
    .slice(0, 3)
    .map(r => r.id)

  function handleShare() {
    const text = `📊 My GCSE Maths Diagnostic Results\n\nScore: ${masteryPercent}%\n${masteredCount} of ${totalSkills} skills mastered\n\nTry it yourself at mathsense.net`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      setCopyLabel('✅ Copied!')
      setTimeout(() => setCopyLabel('📋 Copy results'), 2000)
    }
    trackEvent('results_shared')
  }

  function handleCopyResults() {
    const lines = [
      `📊 My GCSE Maths Diagnostic Results`,
      `Score: ${masteryPercent}%`,
      `${masteredCount} of ${totalSkills} skills mastered`,
      ``,
      `Try it yourself at mathsense.net`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopyLabel('✅ Copied!')
    setTimeout(() => setCopyLabel('📋 Copy results'), 2000)
    trackEvent('results_copied')
  }

  function handleDownloadPDF() {
    trackEvent('pdf_downloaded')
    generatePDF({
      topicSkills,
      mastered,
      needsPractice,
      masteryPercent,
      masteredCount,
      totalSkills,
      recommendations: sortedRecs,
      studentName,
    })
  }

  function handleDownloadCSV() {
    trackEvent('csv_downloaded')
    const rows = [
      ['Skill', 'Topic', 'Status'],
      ...Array.from(mastered).map(id => [skillsById[id]?.name ?? id, skillsById[id]?.topic ?? '', 'Mastered']),
      ...Array.from(needsPractice).map(id => [skillsById[id]?.name ?? id, skillsById[id]?.topic ?? '', 'Needs Practice']),
      ...Array.from(untested).map(id => [skillsById[id]?.name ?? id, skillsById[id]?.topic ?? '', 'Untested']),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mathsense_results.csv'
    a.click()
  }

  const allTopics = Object.keys(topicSkills).sort()

  return (
    <main style={styles.page}>
      <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
        Diagnostic complete
      </h1>

      {/* Summary */}
      <div style={card}>
        <div style={styles.summaryRow}>
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryNumber, color: colors.success }}>{masteredCount}</span>
            <span style={styles.summaryLabel}>Mastered</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryNumber, color: colors.danger }}>{needsPractice.size}</span>
            <span style={styles.summaryLabel}>Need practice</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.summaryItem}>
            <span style={{ ...styles.summaryNumber, color: colors.primary }}>{masteryPercent}%</span>
            <span style={styles.summaryLabel}>Mastery</span>
          </div>
        </div>
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressBar,
            width: `${masteryPercent}%`,
            background: masteryPercent >= 70 ? colors.success : masteryPercent >= 40 ? colors.warning : colors.danger,
          }} />
        </div>
      </div>

      {/* Recommendations */}
      {sortedRecs.length > 0 && (
        <div style={styles.recommendationsBox}>
          <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 8px', color: colors.warningText }}>
            ⭐ We suggest working on next:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sortedRecs.map(id => (
              <div key={id} style={styles.recommendationItem}>
                <span style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary }}>
                  {skillsById[id]?.name ?? id}
                </span>
                <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                  {skillsById[id]?.topic}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
		<div style={styles.actions}>
		  <button onClick={handleShare} style={styles.actionButton}>📤 Share results</button>
		  <button onClick={handleCopyResults} style={styles.actionButton}>{copyLabel}</button>
		</div>

		<h2 style={{ fontSize: font.lg, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
		  Topic mastery
		</h2>

      {allTopics.map(topic => {
        const skillIds = topicSkills[topic] ?? []
        const topicMastered = skillIds.filter(id => mastered.has(id))
        const topicNeeds = skillIds.filter(id => needsPractice.has(id))
        const topicUntested = skillIds.filter(id => untested.has(id))
        const diagnosed = topicMastered.length + topicNeeds.length
        const pct = diagnosed > 0 ? Math.round((topicMastered.length / diagnosed) * 100) : null
        const isOpen = openTopics.includes(topic)

        return (
          <div key={topic} style={styles.topicCard}>
            <div style={styles.topicHeader} onClick={() => toggleTopic(topic)}>
              <div>
                <p style={{ fontSize: font.md, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
                  {topic}
                </p>
                <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0' }}>
                  {topicMastered.length} mastered · {topicNeeds.length} need practice
                  {topicUntested.length > 0 && ` · ${topicUntested.length} untested`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {pct !== null && (
                  <span style={{
                    fontSize: font.base,
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: radius.full,
                    color: pct >= 70 ? colors.successText : pct >= 40 ? '#e65100' : colors.dangerText,
                    background: pct >= 70 ? colors.successLight : pct >= 40 ? '#fff3e0' : colors.dangerLight,
                  }}>
                    {pct}%
                  </span>
                )}
                <span style={{ fontSize: font.sm, color: colors.textHint }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div style={styles.topicBody}>
                {([
                  { ids: topicNeeds, label: '✗ Needs practice', color: colors.dangerText, bg: colors.dangerLight, border: colors.dangerBorder },
                  { ids: topicMastered, label: '✓ Mastered', color: colors.successText, bg: colors.successLight, border: colors.successBorder },
                  { ids: topicUntested, label: '— Untested', color: colors.textSecondary, bg: colors.background, border: colors.border },
                ]).map(({ ids, label, color, bg, border }) => ids.length === 0 ? null : (
                  <div key={label} style={styles.group}>
                    <p style={{ fontSize: font.base, fontWeight: '600', margin: 0, color }}>{label}</p>
                    <div style={styles.tags}>
                      {ids.map(id => (
                        <span key={id} style={{ ...styles.tag, background: bg, color, border: `1px solid ${border}` }}>
                          {skillsById[id]?.name ?? id}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={handleDownloadPDF} style={styles.actionButton}>⬇ Download PDF</button>
        <button onClick={handleDownloadCSV} style={styles.actionButton}>⬇ Download CSV</button>
        <Link
          href="/contact?from=results"
          onClick={() => trackEvent('feedback_clicked')}
          style={{ ...styles.actionButton, textDecoration: 'none', display: 'block', boxSizing: 'border-box' as const }}
        >
          💬 Give feedback
        </Link>
        <button
          onClick={() => window.location.reload()}
          style={styles.actionButton}
        >
          🔄 Retake diagnostic
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '24px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: '14px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  summaryNumber: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1',
  },
  summaryLabel: {
    fontSize: font.sm,
    color: colors.textHint,
  },
  divider: {
    width: '1px',
    height: '40px',
    background: colors.border,
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    background: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.full,
    transition: 'width 0.5s ease',
  },
  recommendationsBox: {
    background: colors.warningLight,
    border: `1px solid ${colors.warningBorder}`,
    borderRadius: radius.lg,
    padding: '16px',
  },
  recommendationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    background: colors.card,
    borderRadius: radius.md,
    border: `1px solid ${colors.warningBorder}`,
  },
  topicCard: {
    background: colors.card,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  topicHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    cursor: 'pointer',
    background: colors.cardAlt,
  },
  topicBody: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: `1px solid ${colors.border}`,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  tag: {
    fontSize: font.sm,
    padding: '3px 8px',
    borderRadius: radius.sm,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionButton: {
    background: colors.card,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderStrong}`,
    padding: '10px 20px',
    borderRadius: radius.md,
    fontSize: font.md,
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
  },
}