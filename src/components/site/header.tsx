import Link from 'next/link'

const links = ['Projects', 'Log', 'Writing', 'Stack', 'About']

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
        {links.map((label) => (
          <a key={label} href={`#${label.toLowerCase()}`}>
            {label}
          </a>
        ))}
      </nav>

      <div className="header-state" aria-label="Entity state">
        <span className="status-dot" />
        <span>BOOTSTRAP</span>
      </div>
    </header>
  )
}
