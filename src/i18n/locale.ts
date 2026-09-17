import 'server-only'

import { cookies, headers } from 'next/headers'
import { isLocale, LOCALE_COOKIE, type Locale } from './config'

const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code', 'x-country'] as const

export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const override = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(override)) return override

  const requestHeaders = await headers()
  const country = COUNTRY_HEADERS.map((name) => requestHeaders.get(name)?.trim().toUpperCase()).find(Boolean)
  if (country === 'VN') return 'vi'
  if (country && country !== 'XX' && country !== 'T1') return 'en'

  const accepted = requestHeaders.get('accept-language')?.toLowerCase() ?? ''
  if (accepted.split(',').some((item) => item.trim().startsWith('vi'))) return 'vi'
  return 'en'
}
