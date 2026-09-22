'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { messages } from '@/i18n/messages'

type Props = { locale: Locale }

export function SiteFooter({ locale }: Props) {
  const pathname=usePathname()
  if (pathname.startsWith('/control')) return null

  const t=messages[locale].footerMenu
  const navigate=[
    [t.home,'/'],
    [t.projects,'/projects'],
    [t.writing,'/writing'],
    [t.stack,'/stack'],
    [t.about,'/about'],
    [t.guestbook,'/discuss'],
    [t.music,'/music-sensor'],
  ] as const

  return (
    <footer className="global-site-footer">
      <div className="site-footer-menu">
        <nav aria-label={t.navigate}>
          <span className="site-footer-heading">{t.navigate}</span>
          {navigate.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}
        </nav>
        <nav aria-label={t.elsewhere}>
          <span className="site-footer-heading">{t.elsewhere}</span>
          <Link href="/cv" prefetch={false}>CV</Link>
          <Link href="/verify">{locale==='vi'?'Xác thực tài liệu':'Verify document'}</Link>
          <a href="https://github.com/n8n2erpnext" target="_blank" rel="noreferrer">{t.github}</a>
        </nav>
        <nav aria-label={t.legal}>
          <span className="site-footer-heading">{t.legal}</span>
          <Link href="/terms">{t.terms}</Link>
          <Link href="/privacy">{t.privacy}</Link>
        </nav>
      </div>
      <div className="site-footer-base">
        <span>THAIDUY.DIGITAL / LIVING SYSTEMS LAB</span>
        <span>© 2026 THÁI DUY</span>
      </div>
    </footer>
  )
}
