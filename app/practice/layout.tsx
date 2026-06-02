import type { Metadata } from 'next'

// /practice is a client component and can't export its own metadata, so this
// server layout gives the route a tailored title + social description — useful
// because the practice page is the link shared on social.
export const metadata: Metadata = {
  title: 'Practise GCSE Maths',
  description:
    'Jump straight into GCSE Maths practice with instant feedback and worked solutions. Free to try — no signup needed.',
  openGraph: {
    title: 'Practise GCSE Maths — Mathsense',
    description:
      'Jump straight into GCSE Maths practice with instant feedback and worked solutions. Free to try — no signup needed.',
  },
}

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return children
}
