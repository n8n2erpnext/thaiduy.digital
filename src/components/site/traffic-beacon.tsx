'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

let lastPageviewKey=''
let lastPageviewAt=0

export function TrafficBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/control')) return

    const now=Date.now()
    const key=window.location.href
    if (key===lastPageviewKey && now-lastPageviewAt<1500) return
    lastPageviewKey=key
    lastPageviewAt=now

    const body = {
      type: 'pageview',
      url: window.location.href,
      referrer: document.referrer || undefined,
      title: document.title,
      language: navigator.language,
      properties: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
      },
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
