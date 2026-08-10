import type { Metadata } from 'next'

// The marking tool is a client component and can't export its own metadata, so
// this server layout gives it a title — same pattern as app/practice/layout.tsx.
// It matters here because this is the stop of the tour most likely to be
// bookmarked or forwarded on its own: it is a usable free tool, not a mock-up.
export const metadata: Metadata = {
  title: 'Free GCSE paper marking tool',
  description:
    'Enter your class’s marks for AQA Foundation Paper 3 and get back a question-by-question breakdown, per-student feedback, and a starter sheet. Free, no account.',
  openGraph: {
    title: 'Free GCSE paper marking tool — Mathsense',
    description:
      'Enter your class’s marks and get back a question-by-question breakdown, per-student feedback, and a starter sheet. Free, no account.',
  },
}

export default function MarkingLayout({ children }: { children: React.ReactNode }) {
  return children
}
