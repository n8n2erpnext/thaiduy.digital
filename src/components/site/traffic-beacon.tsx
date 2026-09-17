'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function TrafficBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/control')) return
    const body = {
      type: 'pageview',
      url: window.location.href,
      referrer: document.referrer || undefined,
      title: document.title,
      language: navigator.language,
    }
    void fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
      credentials: 'same-origin',
    })
  }, [pathname])

  return null
}
