import Link from 'next/link'
import { MusicWaveIndicator } from '@/components/living/music-wave-indicator'

const links = [
  { href: '/projects', label: 'Projects' },
  { href: '/log', label: 'Log' },
  { href: '/writing', label: 'Writing' },
  { href: '/stack', label: 'Stack' },
  { href: '/about', label: 'About' },
]

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Thái Duy home">
        <span className="brand-mark">TD</span>
        <span className="brand-copy">
          <strong>Thái Duy</strong>
          <small>systems lab</small>
        </span>
      </Link>

      <nav aria-label="Primary navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <MusicWaveIndicator />
        <div className="header-state" aria-label="Entity state">
          <span className="status-dot" />
          <span>BOOTSTRAP</span>
        </div>
      </div>
    </header>
  )
}
