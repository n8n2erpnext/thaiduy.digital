type AnalyticsProperties=Record<string,unknown>

type AnalyticsPayload={
  type:'event'
  name:string
  url:string
  referrer?:string
  title?:string
  language?:string
  properties?:AnalyticsProperties
}

function deliver(payload:AnalyticsPayload) {
  const body=JSON.stringify(payload)

  if (typeof navigator!=='undefined' && typeof navigator.sendBeacon==='function') {
    const blob=new Blob([body],{type:'application/json'})
    if (navigator.sendBeacon('/api/analytics/collect',blob)) return
  }

  void fetch('/api/analytics/collect',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body,
    keepalive:true,
    credentials:'same-origin',
  })
}

export function trackAnalyticsEvent(name:string,properties:AnalyticsProperties={}) {
  if (typeof window==='undefined') return

  deliver({
    type:'event',
    name,
    url:window.location.href,
    referrer:document.referrer || undefined,
    title:document.title,
    language:navigator.language,
    properties:{
      ...properties,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    },
  })
}
