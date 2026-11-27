'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, requireTeacher } from '../../../lib/auth'
import { investigations } from '../../../data/investigations'
import { sectionTitles } from '../../../lib/skills/investigation'
import { investigatePath } from '../../../lib/skills/slug'
import { skillsById } from '../../../lib/skills/skillGraph'
import { colors, font, radius, card, sectionTitle, secondaryButton } from '../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Teach on the board (docs/audit/34, increment 1).
//
// Every investigation section, to put in front of a class: its prediction with
// lettered options for the room to answer by hand or on mini-whiteboards, a
// Reveal, then the try-it and the rule at projector scale. It stores nothing
// and needs no pupil devices — the first thing to show a teacher, before
// anything heavier is built for classrooms.
//
// Each link opens in a new tab, which is the one to drag onto the projector;
// this list stays on the teacher's own screen.
// ─────────────────────────────────────────────────────────────────────────────

export default function TeachOnTheBoardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getSession().then(async auth => {
      if (!auth) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) return <main style={styles.page}><p style={styles.lede}>Loading…</p></main>

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ ...secondaryButton, width: 'auto', alignSelf: 'flex-start' }}
        >
          ← Dashboard
        </button>
        <div>
          <h1 style={styles.title}>Teach on the board</h1>
          <p style={styles.lede}>
            Pick a section and it opens in a new tab, ready for the projector. The class answers
            its question by hand or on mini-whiteboards; you press Reveal, then try values on the
            board while the class says what to try, and agree the rule together. Nothing is
            stored, and pupils need no devices.
          </p>
        </div>

        {Object.values(investigations).map(inv => {
          const skill = skillsById[inv.skillId]
          return (
            <section key={inv.skillId} style={card}>
              <p style={styles.topic}>{skill?.topic ?? ''}</p>
              <h2 style={{ ...sectionTitle, margin: '0 0 10px' }}>
                {inv.title}
                {inv.underConstruction && <span style={styles.draft}> · still being written</span>}
              </h2>
              <ol style={styles.sections}>
                {sectionTitles(inv).map((title, k) => (
                  <li key={k} style={styles.section}>
                    <a
                      href={`${investigatePath(inv.skillId)}?section=${k + 1}&board=1`}
                      target="_blank"
                      rel="noopener"
                      style={styles.link}
                    >
                      {title} →
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </main>
  )
}

const styles = {
  page: { minHeight: '100vh', background: colors.background, padding: '24px 16px 64px' },
  wrap: { maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: '18px' },
  title: { fontSize: font.xl, fontWeight: '700', margin: '0 0 6px', color: colors.textPrimary },
  lede: { fontSize: font.base, color: colors.textSecondary, lineHeight: '1.6', margin: 0 },
  topic: {
    fontSize: font.sm, fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: colors.primaryHover, margin: '0 0 4px',
  },
  draft: { fontSize: font.sm, fontWeight: '400', color: colors.textSecondary },
  sections: { margin: 0, paddingLeft: '1.4em', display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  section: { fontSize: font.base, color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600', textDecoration: 'none', borderRadius: radius.sm },
}
