import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'vietnamese'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'vietnamese'] })

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  const t = messages[locale].meta
  return { title: t.title, description: t.description }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await resolveLocale()
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
