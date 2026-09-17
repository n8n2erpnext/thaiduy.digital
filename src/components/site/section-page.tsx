import Link from 'next/link'
import { SiteHeader } from '@/components/site/header'

type Props = {
  eyebrow: string
  title: string
  copy: string
  children?: React.ReactNode
}

export function SectionPage({ eyebrow, title, copy, children }: Props) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="section-page">
        <div className="section-page-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{copy}</p>
          <div className="section-source"><span className="activity-dot" /><strong>CONTENT SOURCE</strong><span>NOT CONNECTED</span></div>
        </div>
        <div className="section-page-body">
          {children ?? <p>This surface is intentionally empty until its real content/state source is connected.</p>}
        </div>
        <Link className="text-action" href="/">← Return to living field</Link>
      </main>
    </div>
  )
}
