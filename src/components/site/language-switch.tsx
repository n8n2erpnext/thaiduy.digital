"use client"

import { useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { LOCALE_COOKIE } from '@/i18n/config'

type Props = { locale: Locale; label: string; title: string }

export function LanguageSwitch({ locale, label, title }: Props) {
  const router = useRouter()
  const nextLocale: Locale = locale === 'vi' ? 'en' : 'vi'

  function switchLanguage() {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Max-Age=31536000; Path=/; SameSite=Lax`
    router.refresh()
  }

  return (
    <button className="language-switch" type="button" onClick={switchLanguage} title={title} aria-label={title}>
      {label}
    </button>
  )
}
