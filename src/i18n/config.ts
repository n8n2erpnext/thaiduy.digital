export const LOCALE_COOKIE = 'td_locale'
export const locales = ['en', 'vi'] as const
export type Locale = (typeof locales)[number]

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'vi'
}
