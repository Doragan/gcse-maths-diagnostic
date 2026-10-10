'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'
import {
  getClassMembers, rotateClassCode, type ClassMember,
  getClassInvitations, inviteToClass, revokeInvitation, resendInvitation,
  type TeacherInvitation,
} from '../../../../lib/classes'
import { STATE_LABEL } from '../../../../lib/invitations'
import ClassAnalytics from '../../../../components/ClassAnalytics'
import ClassCoverage from '../../../../components/ClassCoverage'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
} from '../../../../lib/styles'

export default function ClassRosterPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const classId = params.id

  const [className, setClassName] = useState('')
  const [code, setCode] = useState('')
  const [members, setMembers] = useState<ClassMember[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotateError, setRotateError] = useState('')
  // Bumped when coverage edits are committed → remounts ClassAnalytics to refetch.
  const [coverageVersion, setCoverageVersion] = useState(0)

  const [invitations, setInvitations] = useState<TeacherInvitation[]>([])
  const [emailConfigured, setEmailConfigured] = useState(true)
  const [emailInput, setEmailInput] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      // The class row is readable via RLS only if the teacher owns it.
      const { data: cls } = await supabase
        .from('classes')
        .select('name, code')
        .eq('id', classId)
        .single()
      if (!cls) { setNotFound(true); setLoading(false); return }
      setClassName(cls.name)
      setCode(cls.code)
      try {
        setMembers(await getClassMembers(classId))
      } catch {
        // Roster fetch failed (e.g. not the owner) — show empty rather than break.
      }
      // Returns an empty result on any failure, including the table not
      // existing yet, so the page works whether or not the invitations
      // migration has been applied.
      await loadInvitations()
      setLoading(false)
    })
  }, [classId])

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/student/classes?code=${code}`
    : ''

  // The two numbers a tutor chasing stragglers actually reads. `waiting`
  // counts only the ones where the pupil is the hold-up: a not_sent invitation
  // is the system's problem and must not be reported as somebody dragging
  // their feet.
  const waiting = invitations.filter(i => i.state === 'waiting')
  const joinedCount = invitations.filter(i => i.state === 'joined').length

  async function loadInvitations() {
    const result = await getClassInvitations(classId)
    setInvitations(result.invitations)
    setEmailConfigured(result.emailConfigured)
  }

  async function handleInvite() {
    setInviteError('')
    setInviteResult(null)
    if (!emailInput.trim()) { setInviteError('Paste some email addresses first.'); return }
    setInviting(true)
    try {
      const r = await inviteToClass(classId, emailInput)

      // Says what HAPPENED, not just what was accepted. "30 invited" when
      // nothing was emailed is the failure this whole feature cannot afford —
      // a tutor would go and chase thirty pupils who were never written to.
      const parts = [`${r.invited} invited`]
      if (r.sent > 0) parts.push(`${r.sent} emailed`)
      if (r.failed > 0) {
        parts.push(r.emailConfigured
          ? `${r.failed} could not be emailed`
          : `${r.failed} not emailed (email is not set up)`)
      }
      if (r.rejected.length > 0) parts.push(`skipped ${r.rejected.join(', ')}`)
      setInviteResult(parts.join('; '))

      setEmailInput('')
      await loadInvitations()
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Could not save the invitations.')
    } finally {
      setInviting(false)
    }
  }

  async function handleResend(id: string, email: string) {
    setBusyId(id)
    try {
      const sent = await resendInvitation(classId, id)
      setInviteResult(sent
        ? `Invitation re-sent to ${email}.`
        : `Could not email ${email}. Check the address is right.`)
      await loadInvitations()
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Could not send it again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRevoke(id: string, email: string) {
    if (!confirm(`Withdraw the invitation for ${email}?`)) return
    setBusyId(id)
    try {
      await revokeInvitation(classId, id)
      await loadInvitations()
    } catch {
      alert('Could not withdraw the invitation. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRotate() {
    // Worth a confirm: the old code and every link already shared stop working
    // the moment this returns, and the teacher may have posted it somewhere
    // they can't easily update.
    if (!confirm(
      `Generate a new join code for "${className}"?\n\n`
      + `The current code (${code}) and any links you have already shared will stop working.\n\n`
      + `Students already in the class stay in it — only new joins are affected.`
    )) return

    setRotating(true)
    setRotateError('')
    try {
      setCode(await rotateClassCode(classId))
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : 'Could not generate a new code')
    } finally {
      setRotating(false)
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Class not found
          </h1>
          <button
            onClick={() => router.push('/dashboard/classes')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Back
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          {className}
        </h1>
        <button
          onClick={() => router.push('/dashboard/classes')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          All classes
        </button>
      </div>

      {/* Join code — the thing teachers share with the class */}
      <div style={card}>
        <h2 style={sectionTitle}>Join code</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '40px', fontWeight: '700', color: colors.primary, letterSpacing: '0.15em' }}>
            {code}
          </span>
          <button
            onClick={handleRotate}
            disabled={rotating}
            style={{
              ...secondaryButton,
              width: 'auto', padding: '8px 14px', fontSize: font.sm,
              opacity: rotating ? 0.6 : 1,
              cursor: rotating ? 'default' : 'pointer',
            }}
          >
            {rotating ? 'Generating…' : 'New code'}
          </button>
        </div>
        {rotateError && (
          <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '8px 0 0' }}>
            {rotateError}
          </p>
        )}
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '10px 0 0', lineHeight: '1.6' }}>
          Students sign in at <strong>{typeof window !== 'undefined' ? window.location.host : 'mathsense.net'}/student</strong>,
          open <strong>My classes</strong>, and enter this code. Or share this link:
        </p>
        <div style={styles.linkRow}>
          <span style={styles.link}>{joinUrl}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(joinUrl)}
            style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* Invitations — the alternative to reading a code out in a lesson, and
          the only way to know who has NOT joined, since a code implies no
          expected roster. That gap is the reason this feature exists.

          Deliberately does NOT create accounts: the student still signs up and
          accepts, which is what keeps the account theirs and the membership
          consented. See supabase/migrations/20260915_class_invitations.sql and
          docs/audit/20 §10. */}
      <div style={card}>
        <h2 style={sectionTitle}>
          Invite by email {waiting.length > 0 && (
            <span style={{ color: colors.textHint, fontWeight: '400' }}>({waiting.length} waiting)</span>
          )}
        </h2>
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '4px 0 12px', lineHeight: '1.6' }}>
          Paste your class list — commas, spaces or one per line. Each student gets an
          email with a link. <strong>No accounts are created:</strong> they sign up
          themselves, choose their own password, and accept the invitation. They can use
          any address to sign up, not just the one you invite.
        </p>
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '0 0 12px', lineHeight: '1.6' }}>
          For a student under 16, invite a parent&apos;s address and they can pass the link
          on. Signing up asks the student to confirm they are 13 or over.
        </p>

        {/* Told BEFORE they invite thirty people, not after. */}
        {!emailConfigured && (
          <p style={{
            fontSize: font.sm, color: colors.warningText, background: colors.warningLight,
            border: `1px solid ${colors.warningBorder}`, borderRadius: '6px',
            padding: '8px 10px', margin: '0 0 12px', lineHeight: '1.6',
          }}>
            Email is not configured on this deployment, so invitations will be saved but
            not sent. You can still share a class code.
          </p>
        )}

        <textarea
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          placeholder={'a.pupil@school.sch.uk\nb.pupil@school.sch.uk'}
          rows={4}
          style={{
            width: '100%', padding: '10px 12px', fontSize: font.base,
            border: `1px solid ${colors.border}`, borderRadius: radius.md,
            fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleInvite}
            disabled={inviting || !emailInput.trim()}
            style={{
              ...secondaryButton,
              width: 'auto', padding: '8px 16px',
              background: colors.primary, color: '#fff', border: 'none',
              opacity: inviting || !emailInput.trim() ? 0.6 : 1,
            }}
          >
            {inviting ? 'Inviting…' : 'Invite'}
          </button>
          {inviteResult && (
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{inviteResult}</span>
          )}
        </div>
        {inviteError && (
          <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '8px 0 0' }}>{inviteError}</p>
        )}

        {invitations.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px', fontWeight: '600' }}>
              Invited ({joinedCount} of {invitations.length} joined)
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {invitations.map(i => (
                <li
                  key={i.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px', padding: '8px 0', borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <span style={{ fontSize: font.sm, color: colors.textPrimary, wordBreak: 'break-all' }}>
                    {i.email}
                    <span style={{
                      display: 'block', fontSize: '12px', marginTop: '2px',
                      color: i.state === 'joined' ? colors.successText
                        : i.state === 'not_sent' ? colors.dangerText
                          : colors.textHint,
                    }}>
                      {STATE_LABEL[i.state]}
                      {/* Expected, not an anomaly: a school address invited and
                          a personal one used, or a parent's address passed on to
                          the child. Shown so the two lists reconcile. */}
                      {i.joined_as && ` — as ${i.joined_as}`}
                    </span>
                  </span>
                  <span style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {/* Re-sending takes an invitation id, never the token: the
                        teacher never holds it, so they cannot accept for a pupil. */}
                    {(i.state === 'waiting' || i.state === 'not_sent') && (
                      <button
                        onClick={() => handleResend(i.id, i.email)}
                        disabled={busyId === i.id}
                        style={{
                          ...secondaryButton, width: 'auto', padding: '4px 10px',
                          fontSize: font.sm, opacity: busyId === i.id ? 0.6 : 1,
                        }}
                      >
                        {busyId === i.id ? '…' : i.state === 'not_sent' ? 'Send' : 'Send again'}
                      </button>
                    )}
                    {(i.state === 'waiting' || i.state === 'not_sent' || i.state === 'expired') && (
                      <button
                        onClick={() => handleRevoke(i.id, i.email)}
                        disabled={busyId === i.id}
                        style={{
                          ...secondaryButton, width: 'auto', padding: '4px 10px',
                          fontSize: font.sm, opacity: busyId === i.id ? 0.6 : 1,
                        }}
                      >
                        Withdraw
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Roster */}
      <div style={card}>
        <h2 style={sectionTitle}>
          Students {members.length > 0 && <span style={{ color: colors.textHint, fontWeight: '400' }}>({members.length})</span>}
        </h2>
        {members.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: '1.6' }}>
            No students have joined yet. Share the code above to get started.
          </p>
        ) : (
          <div style={styles.list}>
            {members.map(m => (
              <div key={m.student_id} style={styles.memberRow}>
                <span style={{ fontSize: font.md, color: colors.textPrimary }}>
                  {m.display_name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.year_group && (
                    <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                      {m.year_group}
                    </span>
                  )}
                  <span style={{ fontSize: font.sm, color: colors.textHint }}>
                    Joined {new Date(m.joined_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record a paper you have marked — the third source of skill evidence,
          alongside self-serve practice and assignments. */}
      <div style={{ ...styles.card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={sectionTitle}>Marked a paper?</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '6px 0 0', lineHeight: 1.6 }}>
            Enter the marks and they become part of each student&apos;s skill map — full marks
            counts as secure, and a dropped mark never pulls a skill down.
          </p>
        </div>
        <Link
          href={`/dashboard/classes/${classId}/papers`}
          style={{
            background: colors.primary, color: '#fff', padding: '11px 20px',
            borderRadius: radius.md, fontSize: font.base, fontWeight: '700',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Record marks →
        </Link>
      </div>

      {/* Teacher-marked coverage — scopes the mastery % to what's been taught */}
      <ClassCoverage classId={classId} onChange={() => setCoverageVersion(v => v + 1)} />

      {/* Aggregated skill mastery across the class (practice + assignments) */}
      <ClassAnalytics key={coverageVersion} classId={classId} />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '780px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  link: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    background: colors.cardAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: '8px 10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  memberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  },
}
