import Image from 'next/image'
import Link from 'next/link'
import { MusicWaveIndicator } from '@/components/living/music-wave-indicator'
import { LanguageSwitch } from '@/components/site/language-switch'
import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

export async function SiteHeader({ locale }: Props) {
  const t = messages[locale].header
  const nav = await getRegistry('nav')
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={t.homeLabel}>
        <span className="brand-mark"><Image src="/brand-mark.svg" width={22} height={22} alt="" priority /></span>
        <span className="brand-copy"><strong>Thái Duy</strong><small>{t.lab}</small></span>
      </Link>
      <nav aria-label={t.primaryNav}>
        {nav.map((item) => <Link key={item.id} href={String(item.meta?.href ?? '/')}>{textFor(item.label, locale)}</Link>)}
      </nav>
      <div className="header-actions">
        <MusicWaveIndicator locale={locale} />
        <LanguageSwitch locale={locale} label={t.language} title={t.languageTitle} />
        <div className="header-state" aria-label={t.entityState}><span className="status-dot" /><span>{t.bootstrap}</span></div>
      </div>
    </header>
  )
}
