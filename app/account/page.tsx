'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, updateEmail, updatePassword, deleteAccount, signOut } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { getMyDisplayName, setMyDisplayName } from '../../lib/classes'
import { courses } from '../../data/courses'
import { applyAccountCourse } from '../../lib/skills/accountCourse'
import {
  colors, font, card,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox, sectionTitle,
} from '../../lib/styles'

// This page serves BOTH roles. It was written for teachers and only the teacher
// dashboard linked to it, so a student had no route to changing their password
// or closing their account — on accounts the student owns, which made the right
// to erasure undeliverable in practice for them. The student dashboard now links
// here too, so the three things that differ by role are resolved at runtime:
// where "back" goes, what deletion actually removes, and the email placeholder.
export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isStudent, setIsStudent] = useState(false)
  const [loading, setLoading] = useState(true)

  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Teacher-only. What invitation emails say the sender is called; null until
  // set. See app/api/account/display-name for why this is not an RLS write.
  const [displayName, setDisplayName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)

  // Student-only. Which course they are sitting, as a data/courses.ts id, or
  // '' for not stated. Held on the ACCOUNT so it follows them between devices,
  // unlike the per-browser qualification and tier it feeds.
  const [userId, setUserId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [courseSaved, setCourseSaved] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    getUser().then(async user => {
      // Logged out, so the role is unknowable. This used to send everyone to
      // /auth, the TEACHER login, which is the wrong-role confusion this
      // codebase keeps running into. Home serves both.
      if (!user) { router.push('/'); return }
      setEmail(user.email ?? '')
      setUserId(user.id)

      // A student may read their own students row; a teacher gets nothing back,
      // because the SELECT policy is auth.uid() = id. So "a row came back" is a
      // sufficient role test and needs no new endpoint.
      //
      // select('*') rather than naming course_id, deliberately: this one query
      // is BOTH the role test and the course read, and naming a column that does
      // not exist errors the whole query. Were the code ever to reach production
      // ahead of 20261016_student_course.sql, that would make every student look
      // like a teacher here. With '*' an unapplied migration just leaves
      // course_id undefined, and the page still knows who it is talking to.
      const { data: studentRow } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      setIsStudent(!!studentRow)
      setCourseId(studentRow?.course_id ?? '')

      // Only teachers have one; the route answers 403 for a student and the
      // helper turns that into null, so this is safe to call either way.
      if (!studentRow) setDisplayName((await getMyDisplayName()) ?? '')

      setLoading(false)
    })
  }, [])

  async function handleEmailChange() {
    setEmailError(null)
    setEmailSuccess(false)
    if (!newEmail.trim()) return
    if (newEmail === email) {
      setEmailError('That is already your current email address.')
      return
    }
    setEmailLoading(true)
    try {
      await updateEmail(newEmail)
      setEmailSuccess(true)
      setNewEmail('')
    } catch (e: any) {
      setEmailError(e.message)
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePasswordChange() {
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    setPasswordLoading(true)
    try {
      await updatePassword(newPassword)
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setPasswordError(e.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null)
    if (deleteConfirm !== email) {
      setDeleteError('Please type your email address exactly to confirm.')
      return
    }
    setDeleteLoading(true)
    try {
      await deleteAccount()
      await signOut()
      router.push('/')
    } catch (e: any) {
      setDeleteError(e.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleNameSave() {
    setNameError(null)
    setNameSaved(false)
    setNameLoading(true)
    try {
      // Show what was STORED, not what was typed — the server collapses
      // whitespace, so echoing the draft back could disagree with the row.
      setDisplayName((await setMyDisplayName(displayName)) ?? '')
      setNameSaved(true)
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Could not save your name')
    } finally {
      setNameLoading(false)
    }
  }

  /**
   * Save the course, then apply it to THIS browser straight away.
   *
   * Without the second step the student would change their course here and
   * still see the old one until the next profile fetch, which is the kind of
   * lag that reads as the setting not having worked.
   *
   * '' stores NULL — not stated — which deliberately leaves the per-browser
   * preference alone rather than resetting it to a default.
   */
  async function handleCourseChange(next: string) {
    setCourseError(null)
    setCourseSaved(false)
    setCourseLoading(true)
    const value = next === '' ? null : next
    try {
      const { error } = await supabase
        .from('students')
        .update({ course_id: value })
        .eq('id', userId)
      if (error) throw new Error(error.message)
      setCourseId(next)
      applyAccountCourse({ course_id: value })
      setCourseSaved(true)
    } catch (e) {
      setCourseError(e instanceof Error ? e.message : 'Could not save your course')
    } finally {
      setCourseLoading(false)
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <button
          onClick={() => router.push(isStudent ? '/student/dashboard' : '/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back to dashboard
        </button>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Account settings
        </h1>
      </div>

      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
        Logged in as <strong>{email}</strong>
      </p>

      {/* Your exam — students only. A teacher sits no paper, and the course
          they teach is a property of a class rather than of their account. */}
      {isStudent && (
        <div style={card}>
          <h2 style={sectionTitle}>Your exam</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Sets which skills you practise and which exam boards you can compare
            yourself against. Saved to your account, so it follows you to any
            device you sign in on.
          </p>
          <div style={styles.field}>
            <label style={labelStyle}>Course</label>
            {/* One control over whole courses rather than a qualification picker
                and a tier picker. Two controls can express a pair that is not a
                real course; this cannot. */}
            <select
              value={courseId}
              onChange={e => handleCourseChange(e.target.value)}
              disabled={courseLoading}
              style={inputStyle}
            >
              <option value="">Not stated</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {courseError && <div style={errorBox}>{courseError}</div>}
          {courseSaved && !courseError && (
            <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>Saved.</p>
          )}
        </div>
      )}

      {/* Your name — teachers only. A student has no invitations to send and
          already sets their own name at signup. */}
      {!isStudent && (
        <div style={card}>
          <h2 style={sectionTitle}>Your name</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Shown on class invitation emails, so students recognise who sent them. Use the
            name your students know you by. Leave it blank and invitations say
            &ldquo;Your teacher&rdquo;.
          </p>
          {/* Said plainly, because a teacher deciding what to type here deserves
              to know the audience: these emails go to children, and the sender's
              name is the main thing that makes one look legitimate. */}
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 0', lineHeight: 1.5 }}>
            Your email address is never shown to students.
          </p>
          <div style={styles.field}>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setNameSaved(false) }}
              style={inputStyle}
              placeholder="Mr Okafor"
              autoComplete="name"
              maxLength={60}
              onKeyDown={e => e.key === 'Enter' && handleNameSave()}
            />
          </div>
          {nameError && <p style={errorBox}>{nameError}</p>}
          {nameSaved && (
            <p style={{ fontSize: font.base, color: colors.successText, margin: 0 }}>
              {displayName
                ? `Saved. Invitations will say "${displayName} has invited you…"`
                : 'Cleared. Invitations will say "Your teacher has invited you…"'}
            </p>
          )}
          <button
            onClick={handleNameSave}
            disabled={nameLoading}
            style={{ ...primaryButton, width: 'auto', opacity: nameLoading ? 0.6 : 1 }}
          >
            {nameLoading ? 'Saving…' : 'Save name'}
          </button>
        </div>
      )}

      {/* Change email */}
      <div style={card}>
        <h2 style={sectionTitle}>Change email address</h2>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          You'll receive a confirmation link at your new address before the change takes effect.
        </p>
        <div style={styles.field}>
          <label style={labelStyle}>New email address</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            style={inputStyle}
            placeholder={isStudent ? 'new@example.com' : 'new@school.ac.uk'}
            autoComplete="email"
            onKeyDown={e => e.key === 'Enter' && handleEmailChange()}
          />
        </div>
        {emailError && <p style={errorBox}>{emailError}</p>}
        {emailSuccess && (
          <p style={{ ...errorBox, background: colors.successLight, color: colors.successText, border: `1px solid ${colors.successBorder}` }}>
            Confirmation email sent. Please check your inbox.
          </p>
        )}
        <button
          onClick={handleEmailChange}
          disabled={emailLoading || !newEmail}
          style={{ ...primaryButton, opacity: emailLoading || !newEmail ? 0.6 : 1 }}
        >
          {emailLoading ? 'Sending...' : 'Update email'}
        </button>
      </div>

      {/* Change password */}
      <div style={card}>
        <h2 style={sectionTitle}>Change password</h2>
        <div style={styles.field}>
          <label style={labelStyle}>New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        {newPassword && (
          <div>
            <div style={styles.strengthTrack}>
              <div style={{
                ...styles.strengthFill,
                width: newPassword.length >= 12 ? '100%' : newPassword.length >= 8 ? '60%' : '30%',
                background: newPassword.length >= 12 ? colors.success : newPassword.length >= 8 ? colors.warning : colors.danger,
              }} />
            </div>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
              {newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Acceptable' : 'Too short'}
            </p>
          </div>
        )}
        <div style={styles.field}>
          <label style={labelStyle}>Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            autoComplete="new-password"
            onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
          />
        </div>
        {passwordError && <p style={errorBox}>{passwordError}</p>}
        {passwordSuccess && (
          <p style={{ ...errorBox, background: colors.successLight, color: colors.successText, border: `1px solid ${colors.successBorder}` }}>
            Password updated successfully.
          </p>
        )}
        <button
          onClick={handlePasswordChange}
          disabled={passwordLoading || !newPassword || !confirmPassword}
          style={{ ...primaryButton, opacity: passwordLoading || !newPassword || !confirmPassword ? 0.6 : 1 }}
        >
          {passwordLoading ? 'Updating...' : 'Update password'}
        </button>
      </div>

      {/* Delete account */}
      <div style={{ ...card, border: `1px solid ${colors.dangerBorder}` }}>
        <h2 style={{ ...sectionTitle, color: colors.dangerText }}>Delete account</h2>
        {/* Stated plainly and in full, with no persuasion either way. The
            Children's Code asks that a child understands what happens, not that
            the consequence be dressed up to discourage them — so this lists what
            goes and stops. The typed-email confirmation is the safeguard against
            an accidental click; the copy is not. */}
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          {isStudent
            ? 'This permanently deletes your account and everything in it: your practice history, your progress on every skill, any classes you have joined, and any mini-exams you have taken. Your teacher will no longer see your results. If you have a paid subscription, it is cancelled at the same time, so you will not be charged again — whoever was paying for it, including a parent. This cannot be undone.'
            : 'This will permanently delete your account, all your assessments, and all student results. This cannot be undone.'}
        </p>
        <div style={styles.field}>
          <label style={labelStyle}>
            Type <strong>{email}</strong> to confirm
          </label>
          <input
            type="email"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            style={inputStyle}
            placeholder={email}
            autoComplete="off"
          />
        </div>
        {deleteError && <p style={errorBox}>{deleteError}</p>}
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading || deleteConfirm !== email}
          style={{
            ...primaryButton,
            background: colors.danger,
            opacity: deleteLoading || deleteConfirm !== email ? 0.6 : 1,
          }}
        >
          {deleteLoading ? 'Deleting...' : 'Permanently delete account'}
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  strengthTrack: {
    width: '100%',
    height: '4px',
    background: colors.border,
    borderRadius: '2px',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease, background 0.3s ease',
  },
}