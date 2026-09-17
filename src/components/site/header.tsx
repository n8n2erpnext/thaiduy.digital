import Link from 'next/link'
import { MusicWaveIndicator } from '@/components/living/music-wave-indicator'
import { LanguageSwitch } from '@/components/site/language-switch'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

export function SiteHeader({ locale }: Props) {
  const t = messages[locale].header
  const links = [
    { href: '/projects', label: t.nav.projects },
    { href: '/log', label: t.nav.log },
    { href: '/writing', label: t.nav.writing },
    { href: '/stack', label: t.nav.stack },
    { href: '/about', label: t.nav.about },
  ]

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={t.homeLabel}>
        <span className="brand-mark">TD</span>
        <span className="brand-copy"><strong>Thái Duy</strong><small>{t.lab}</small></span>
      </Link>
      <nav aria-label={t.primaryNav}>
        {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
      <div className="header-actions">
        <MusicWaveIndicator locale={locale} />
        <LanguageSwitch locale={locale} label={t.language} title={t.languageTitle} />
        <div className="header-state" aria-label={t.entityState}><span className="status-dot" /><span>{t.bootstrap}</span></div>
      </div>
    </header>
  )
}
