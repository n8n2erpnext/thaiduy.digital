const fixedOrigins = new Set([
  'https://thaiduy.digital',
  'http://localhost:3000',
])

function configuredOrigins() {
  const origins = new Set(fixedOrigins)
  const configured = process.env.BETTER_AUTH_URL?.trim()
  if (configured) {
    try { origins.add(new URL(configured).origin) } catch {}
  }
  return origins
}

export function requestOriginAllowed(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite === 'cross-site') return false

  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return configuredOrigins().has(new URL(origin).origin)
  } catch {
    return false
  }
}
