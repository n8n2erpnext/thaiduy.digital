import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import './globals.css'

const googleSans = localFont({
  src: [
    { path: '../../public/fonts/GoogleSans-VariableFont_GRAD,opsz,wght.ttf', style: 'normal' },
    { path: '../../public/fonts/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf', style: 'italic' },
  ],
  variable: '--font-google-sans',
  display: 'swap',
})

const googleSansCode = localFont({
  src: [
    { path: '../../public/fonts/GoogleSansCode-VariableFont_MONO,wght.ttf', style: 'normal' },
    { path: '../../public/fonts/GoogleSansCode-Italic-VariableFont_MONO,wght.ttf', style: 'italic' },
  ],
  variable: '--font-google-sans-code',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  const t = messages[locale].meta
  return { title: t.title, description: t.description }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await resolveLocale()
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${googleSans.variable} ${googleSansCode.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
