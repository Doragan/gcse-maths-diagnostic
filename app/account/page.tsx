'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, updateEmail, updatePassword, deleteAccount, signOut } from '../../lib/auth'
import {
  colors, font, card,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox, sectionTitle,
} from '../../lib/styles'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
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

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    getUser().then(user => {
      if (!user) { router.push('/auth'); return }
      setEmail(user.email ?? '')
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
          onClick={() => router.push('/dashboard')}
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
            placeholder="new@school.ac.uk"
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
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          This will permanently delete your account, all your assessments, and all student results. This cannot be undone.
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