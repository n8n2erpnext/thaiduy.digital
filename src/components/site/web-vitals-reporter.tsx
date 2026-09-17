'use client'

import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'

const supported = new Set(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'])

export function WebVitalsReporter() {
  const pathname = usePathname()

  useReportWebVitals(metric => {
    if (!pathname || pathname.startsWith('/control') || !supported.has(metric.name)) return
    const body: Record<string, unknown> = {
      type: 'performance',
      url: window.location.href,
      title: document.title,
      language: navigator.language,
      properties: { id: metric.id, rating: metric.rating, navigationType: metric.navigationType },
    }
    body[metric.name.toLowerCase()] = metric.value
    const payload = JSON.stringify(body)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/collect', new Blob([payload], { type: 'application/json' }))
      return
    }
    void fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'same-origin',
    })
  })

  return null
}
