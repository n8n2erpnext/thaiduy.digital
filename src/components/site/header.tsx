import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { MusicWaveIndicator } from '@/components/living/music-wave-indicator'
import { HeaderCommand } from '@/components/site/header-command'
import { LanguageSwitch } from '@/components/site/language-switch'
import { SiteSearch } from '@/components/site/site-search'
import { ThemeSwitch } from '@/components/site/theme-switch'
import { MobileNav } from '@/components/site/mobile-nav'
import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { auth } from '@/lib/auth'
import { isCommunityAdminEmail } from '@/community/data'
import { getSiteSetting, type SiteIdentity } from '@/lib/site-settings'

type Props = { locale: Locale }

export async function SiteHeader({ locale }: Props) {
  const t = messages[locale].header
  const requestHeaders=await headers()
  const [nav, musicEnabled, identity, session] = await Promise.all([
    getRegistry('nav'),
    isFeatureEnabled('music.sensor', true),
    getSiteSetting<SiteIdentity>('site.identity', {}),
    auth.api.getSession({headers:requestHeaders}),
  ])

  const brandName = identity.name?.trim() || 'Thái Duy'
  const brandLab = identity.lab?.[locale]?.trim() || t.lab
  const homeLabel = t.homeLabel.replace('Thái Duy', brandName)
  const mobileNavItems=nav.map((item)=>({
    id:item.id,
    href:String(item.meta?.href ?? '/'),
    label:textFor(item.label,locale),
  }))

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={homeLabel}>
        <span className="brand-mark">
          <Image src="/brand-mark.svg" width={32} height={32} alt="" priority />
        </span>
        <span className="brand-copy">
          <strong>{brandName}</strong>
          <small>{brandLab}</small>
        </span>
      </Link>
      <nav aria-label={t.primaryNav}>
        {nav.map((item) => (
          <Link key={item.id} href={String(item.meta?.href ?? '/')}>
            {textFor(item.label, locale)}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <SiteSearch locale={locale} />
        <ThemeSwitch locale={locale} />
        {musicEnabled && <MusicWaveIndicator locale={locale} />}
        <LanguageSwitch
          locale={locale}
          label={t.language}
          title={t.languageTitle}
        />
        <HeaderCommand
          locale={locale}
          viewer={session?.user?{
            name:session.user.name,
            image:session.user.image ?? null,
            isOwner:isCommunityAdminEmail(session.user.email),
          }:null}
        />
        <MobileNav items={mobileNavItems} locale={locale} ariaLabel={t.primaryNav}/>
      </div>
    </header>
  )
}
