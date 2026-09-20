import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SiteFooter } from '@/components/site/footer'
import { TrafficBeacon } from '@/components/site/traffic-beacon'
import { WebVitalsReporter } from '@/components/site/web-vitals-reporter'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { isFeatureEnabled } from '@/lib/feature-flags'
import {
  getSiteSetting,
  type SiteIdentity,
  type SiteMeta,
} from '@/lib/site-settings'
import './globals.css'

const googleSans = localFont({
  src: [
    {
      path: '../../public/fonts/GoogleSans-VariableFont_GRAD,opsz,wght.ttf',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-google-sans',
  display: 'swap',
})

const googleSansCode = localFont({
  src: [
    {
      path: '../../public/fonts/GoogleSansCode-VariableFont_MONO,wght.ttf',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GoogleSansCode-Italic-VariableFont_MONO,wght.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-google-sans-code',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  const t = messages[locale].meta
  const [identity, meta] = await Promise.all([
    getSiteSetting<SiteIdentity>('site.identity', {}),
    getSiteSetting<SiteMeta>('site.meta', {}),
  ])

  const brandName = identity.name?.trim() || 'Thái Duy'
  const fallbackTitle = t.title.replace('Thái Duy', brandName)
  const title = meta.title?.[locale]?.trim() || fallbackTitle
  const description = meta.description?.[locale]?.trim() || t.description

  let metadataBase: URL | undefined
  const domain = identity.domain?.trim()
  if (domain) {
    try {
      metadataBase = new URL(
        domain.startsWith('http://') || domain.startsWith('https://')
          ? domain
          : `https://${domain}`,
      )
    } catch {}
  }

  return { title, description, metadataBase }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await resolveLocale()
  const trafficEnabled = await isFeatureEnabled('traffic.analytics', true)

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      data-theme="dark"
      suppressHydrationWarning
      className={`${googleSans.variable} ${googleSansCode.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:"try{var t=localStorage.getItem('thaiduy-theme');var m=t==='normal'?'normal':'dark';document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m==='dark'?'dark':'light'}catch(e){}",
          }}
        />
      </head>
      <body>
        {children}
        <SiteFooter locale={locale} />
        {trafficEnabled && <TrafficBeacon />}
        {trafficEnabled && <WebVitalsReporter />}
      </body>
    </html>
  )
}
