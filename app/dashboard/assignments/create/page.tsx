'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'
import { getTeacherClasses, getClassMembers, type TeacherClass, type ClassMember } from '../../../../lib/classes'
import { createAssignment } from '../../../../lib/assignments'
import { skills } from '../../../../data/skills'
import { skillsById } from '../../../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle, errorBox,
} from '../../../../lib/styles'

type PickedQuestion = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_template: string
  question_type: string
}

// Unique topics from the skill list
const TOPICS = [...new Set(skills.map(s => s.topic))].sort()

const COMPLETION_OPTIONS = [
  {
    value: 'attempt_once',
    label: 'Attempt once',
    desc: 'Student answers each question once. You see their score.',
  },
  {
    value: 'until_correct',
    label: 'Until correct',
    desc: 'Student retries until correct. You see completion.',
  },
  {
    value: 'mastery_based',
    label: 'Mastery-based',
    desc: 'Student keeps practising the skill until mastered. Open-ended.',
  },
]

export default function CreateAssignmentPage() {
  const router = useRouter()
  const dateInputRef = useRef<HTMLInputElement>(null)

  // ── Form state ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectionMode, setSelectionMode] = useState<'picked' | 'pool'>('picked')
  const [completionMode, setCompletionMode] = useState<'attempt_once' | 'until_correct' | 'mastery_based'>('attempt_once')
  const [dueAt, setDueAt] = useState('')

  // Picked mode
  const [pickedQuestions, setPickedQuestions] = useState<PickedQuestion[]>([])
  const [browseSkillId, setBrowseSkillId] = useState('')
  const [browseTopic, setBrowseTopic] = useState('')
  const [browseResults, setBrowseResults] = useState<PickedQuestion[]>([])
  const [browsing, setBrowsing] = useState(false)

  // Pool mode
  const [poolTopic, setPoolTopic] = useState('')
  const [poolSkillId, setPoolSkillId] = useState('')
  const [poolCount, setPoolCount] = useState(10)

  // Targets
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [targetClassIds, setTargetClassIds] = useState<string[]>([])
  const [rosters, setRosters] = useState<Record<string, ClassMember[]>>({})
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([])

  // Submit
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // ── Load teacher's classes ───────────────────────────────────────────────
  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      setClasses(await getTeacherClasses())
    })
  }, [])

  // ── Question browser ─────────────────────────────────────────────────────
  async function browseQuestions(skillId: string) {
    if (!skillId) { setBrowseResults([]); return }
    setBrowsing(true)
    const { data } = await supabase
      .from('questions')
      .select('id, skill_ids, difficulty, question_template, question_type')
      .eq('is_published', true)
      .overlaps('skill_ids', [skillId])
      .order('difficulty', { ascending: true })
    setBrowseResults((data ?? []) as PickedQuestion[])
    setBrowsing(false)
  }

  function addQuestion(q: PickedQuestion) {
    if (!pickedQuestions.find(p => p.id === q.id)) {
      setPickedQuestions(prev => [...prev, q])
    }
  }

  function removeQuestion(id: string) {
    setPickedQuestions(prev => prev.filter(q => q.id !== id))
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const next = [...pickedQuestions]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setPickedQuestions(next)
  }

  // ── Class roster for individual targeting ────────────────────────────────
  async function loadRoster(classId: string) {
    if (rosters[classId]) return
    const members = await getClassMembers(classId)
    setRosters(prev => ({ ...prev, [classId]: members }))
  }

  function toggleClass(classId: string) {
    setTargetClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId],
    )
    if (!rosters[classId]) loadRoster(classId)
  }

  function toggleStudent(studentId: string) {
    setTargetStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId],
    )
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleCreate() {
    setCreateError('')
    if (!title.trim()) { setCreateError('Title is required.'); return }
    if (selectionMode === 'picked' && pickedQuestions.length === 0) {
      setCreateError('Add at least one question.'); return
    }
    if (selectionMode === 'pool' && !poolSkillId) {
      setCreateError('Choose a skill for the question pool.'); return
    }
    if (targetClassIds.length === 0 && targetStudentIds.length === 0) {
      setCreateError('Choose at least one target class or student.'); return
    }

    setCreating(true)
    try {
      const assignment = await createAssignment({
        title,
        instructions,
        selectionMode,
        skillIds:         selectionMode === 'pool' ? [poolSkillId] : [],
        targetCount:      selectionMode === 'pool' ? poolCount : 0,
        completionMode,
        dueAt,
        pickedQuestionIds: pickedQuestions.map(q => q.id),
        targetClassIds,
        targetStudentIds,
      })
      router.push(`/dashboard/assignments/${assignment.id}`)
    } catch (e: any) {
      setCreateError(e?.message ?? 'Could not create assignment.')
    } finally {
      setCreating(false)
    }
  }

  // ── Skill lists filtered by topic ────────────────────────────────────────
  const skillsForBrowseTopic = browseTopic
    ? skills.filter(s => s.topic === browseTopic)
    : []
  const skillsForPoolTopic = poolTopic
    ? skills.filter(s => s.topic === poolTopic)
    : []

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          New assignment
        </h1>
        <button
          onClick={() => router.push('/dashboard/assignments')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          Cancel
        </button>
      </div>

      {/* ── Title & instructions ─────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Assignment title, e.g. Indices homework"
            maxLength={120}
            style={inputStyle}
          />
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Instructions for students (optional)"
            maxLength={2000}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
          />
          <div>
            <label style={{ fontSize: font.sm, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
              Due date (optional)
            </label>
            <input
              ref={dateInputRef}
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              onClick={() => dateInputRef.current?.showPicker?.()}
              style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* ── Selection mode ───────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Questions</h2>
        <div style={styles.modeToggle}>
          {(['picked', 'pool'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSelectionMode(mode)}
              style={{
                ...styles.modeBtn,
                background: selectionMode === mode ? colors.primary : 'transparent',
                color: selectionMode === mode ? '#fff' : colors.textSecondary,
              }}
            >
              {mode === 'picked' ? 'Hand-pick questions' : 'From skill pool'}
            </button>
          ))}
        </div>

        {selectionMode === 'picked' && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Question browser */}
            <div style={styles.browserPanel}>
              <p style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, margin: '0 0 8px' }}>
                Browse questions by skill
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                <select
                  value={browseTopic}
                  onChange={e => { setBrowseTopic(e.target.value); setBrowseSkillId(''); setBrowseResults([]) }}
                  style={{ ...inputStyle, flex: 1, minWidth: '140px' }}
                >
                  <option value="">Topic…</option>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select
                  value={browseSkillId}
                  onChange={e => { setBrowseSkillId(e.target.value); browseQuestions(e.target.value) }}
                  style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
                  disabled={!browseTopic}
                >
                  <option value="">Skill…</option>
                  {skillsForBrowseTopic.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {browsing && <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 0' }}>Loading…</p>}
              {browseResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', maxHeight: '280px', overflowY: 'auto' as const }}>
                  {browseResults.map(q => {
                    const alreadyAdded = pickedQuestions.some(p => p.id === q.id)
                    return (
                      <div key={q.id} style={styles.questionBrowseRow}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: font.sm,
                            color: colors.textPrimary,
                            margin: '0 0 3px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical' as const,
                            overflow: 'hidden',
                            lineHeight: '1.45',
                          }}>
                            {q.question_template.replace(/\{[^}]+\}/g, '[…]')}
                          </p>
                          <span style={{ fontSize: '11px', color: colors.textHint }}>
                            {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
                          </span>
                        </div>
                        <button
                          onClick={() => addQuestion(q)}
                          disabled={alreadyAdded}
                          style={{
                            ...secondaryButton,
                            width: 'auto',
                            padding: '4px 10px',
                            fontSize: font.sm,
                            flexShrink: 0,
                            opacity: alreadyAdded ? 0.45 : 1,
                          }}
                        >
                          {alreadyAdded ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              {browseSkillId && !browsing && browseResults.length === 0 && (
                <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 0' }}>
                  No published questions for this skill yet.
                </p>
              )}
            </div>

            {/* Picked list */}
            {pickedQuestions.length > 0 && (
              <div>
                <p style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, margin: '0 0 8px' }}>
                  Selected ({pickedQuestions.length} question{pickedQuestions.length !== 1 ? 's' : ''})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pickedQuestions.map((q, i) => (
                    <div key={q.id} style={styles.pickedRow}>
                      <span style={{ fontSize: font.sm, color: colors.textHint, flexShrink: 0, width: '20px' }}>
                        {i + 1}.
                      </span>
                      <span style={{
                        fontSize: font.sm,
                        color: colors.textPrimary,
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        lineHeight: '1.45',
                      }}>
                        {q.question_template.replace(/\{[^}]+\}/g, '[…]')}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} style={styles.iconBtn}>↑</button>
                        <button onClick={() => moveQuestion(i, 1)} disabled={i === pickedQuestions.length - 1} style={styles.iconBtn}>↓</button>
                        <button onClick={() => removeQuestion(q.id)} style={{ ...styles.iconBtn, color: colors.dangerText }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectionMode === 'pool' && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, lineHeight: '1.6' }}>
              Students are served random questions from the chosen skill until they reach the target count.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              <select
                value={poolTopic}
                onChange={e => { setPoolTopic(e.target.value); setPoolSkillId('') }}
                style={{ ...inputStyle, flex: 1, minWidth: '140px' }}
              >
                <option value="">Topic…</option>
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={poolSkillId}
                onChange={e => setPoolSkillId(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
                disabled={!poolTopic}
              >
                <option value="">Skill…</option>
                {skillsForPoolTopic.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {poolSkillId && (
              <div>
                <label style={{ fontSize: font.sm, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                  Number of questions: <strong>{poolCount}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={poolCount}
                  onChange={e => setPoolCount(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: font.sm, color: colors.textHint }}>
                  <span>1</span><span>25</span><span>50</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Completion mode ──────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Completion rules</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {COMPLETION_OPTIONS.map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '12px',
                borderRadius: radius.md,
                border: `1px solid ${completionMode === opt.value ? colors.primary : colors.border}`,
                background: completionMode === opt.value ? '#eff6ff' : colors.cardAlt,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="completionMode"
                value={opt.value}
                checked={completionMode === opt.value}
                onChange={() => setCompletionMode(opt.value as typeof completionMode)}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <div>
                <p style={{ fontSize: font.base, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '2px 0 0' }}>
                  {opt.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Targets ──────────────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Assign to</h2>
        {classes.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0' }}>
            You haven&apos;t created any classes yet.{' '}
            <button onClick={() => router.push('/dashboard/classes')} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}>
              Create a class
            </button>{' '}first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {classes.map(cls => {
              const classSelected = targetClassIds.includes(cls.id)
              const classRoster   = rosters[cls.id] ?? []
              return (
                <div key={cls.id} style={{ borderRadius: radius.md, border: `1px solid ${classSelected ? colors.primary : colors.border}`, overflow: 'hidden' }}>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', background: classSelected ? '#eff6ff' : colors.cardAlt }}>
                    <input
                      type="checkbox"
                      checked={classSelected}
                      onChange={() => toggleClass(cls.id)}
                    />
                    <span style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary }}>
                      {cls.name}
                    </span>
                    <span style={{ fontSize: font.sm, color: colors.textHint, marginLeft: 'auto' }}>
                      Whole class
                    </span>
                  </label>

                  {/* Individual student selection — shown when class is loaded */}
                  {classSelected && classRoster.length > 0 && (
                    <div style={{ padding: '8px 12px 10px', borderTop: `1px solid ${colors.border}`, background: colors.background }}>
                      <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px' }}>
                        Or override: select specific students only
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {classRoster.map(m => (
                          <label key={m.student_id} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: font.sm, color: colors.textPrimary, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={targetStudentIds.includes(m.student_id)}
                              onChange={() => toggleStudent(m.student_id)}
                            />
                            {m.display_name}
                            {m.year_group && <span style={{ color: colors.textHint }}> · {m.year_group}</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create button ────────────────────────────────────────────────── */}
      {createError && <p style={errorBox}>{createError}</p>}
      <button
        onClick={handleCreate}
        disabled={creating}
        style={{ ...primaryButton, opacity: creating ? 0.6 : 1 }}
      >
        {creating ? 'Creating…' : 'Create assignment'}
      </button>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '24px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  modeToggle: {
    display: 'flex',
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: '8px',
  },
  modeBtn: {
    flex: 1,
    padding: '10px',
    border: 'none',
    fontSize: font.base,
    fontWeight: '600',
    cursor: 'pointer',
  },
  browserPanel: {
    padding: '12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.background,
  },
  questionBrowseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.card,
  },
  pickedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  },
  iconBtn: {
    background: 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: '2px 6px',
    fontSize: font.sm,
    cursor: 'pointer',
    color: colors.textSecondary,
  },
}
