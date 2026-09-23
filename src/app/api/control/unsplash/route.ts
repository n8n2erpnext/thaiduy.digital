import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { assets, auditLogs } from '@/db/schema'
import { getControlIdentityFromHeaders } from '@/lib/control-auth'
import { requestOriginAllowed } from '@/lib/request-security'

type UnsplashPhoto = {
  id:string
  alt_description:string | null
  description:string | null
  urls:{ small:string; regular:string; full:string }
  links:{ html:string; download_location:string }
  user:{ name:string; links:{ html:string } }
}

function withUtm(value: string) {
  const url = new URL(value)
  url.searchParams.set('utm_source','thaiduy_digital')
  url.searchParams.set('utm_medium','referral')
  return url.toString()
}

async function owner(request: NextRequest) {
  if (!requestOriginAllowed(request)) return null
  const identity=await getControlIdentityFromHeaders(request.headers)
  return identity.state==='owner' ? identity.session : null
}
function accessKey() {
  return process.env.UNSPLASH_ACCESS_KEY?.trim() ?? ''
}

function unsplashApiUrl(value:string) {
  try {
    const url=new URL(value)
    return url.protocol==='https:' && url.hostname==='api.unsplash.com' ? url : null
  } catch {
    return null
  }
}

function headers() {
  return {
    Authorization:'Client-ID ' + accessKey(),
    'Accept-Version':'v1',
  }
}

function mapPhoto(photo: UnsplashPhoto) {
  return {
    id:photo.id,
    alt:photo.alt_description || photo.description || ('Photo by ' + photo.user.name),
    smallUrl:photo.urls.small,
    regularUrl:photo.urls.regular,
    fullUrl:photo.urls.full,
    photographer:photo.user.name,
    photographerUrl:withUtm(photo.user.links.html),
    sourceUrl:withUtm(photo.links.html),
  }
}

export async function GET(request: NextRequest) {
  const session = await owner(request)
  if (!session) return NextResponse.json({ error:'unauthorized' },{ status:401 })
  if (!accessKey()) return NextResponse.json({ error:'unsplash_not_configured' },{ status:503 })
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!query) return NextResponse.json({ photos:[] })
  const page = Math.max(1,Number(request.nextUrl.searchParams.get('page') || 1))
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query',query)
  url.searchParams.set('page',String(page))
  url.searchParams.set('per_page','24')
  url.searchParams.set('content_filter','high')

  const response = await fetch(url,{ headers:headers(), cache:'no-store' })
  if (!response.ok) {
    return NextResponse.json({ error:'unsplash_search_failed' },{ status:response.status })
  }
  const payload = await response.json() as {
    total:number
    total_pages:number
    results:UnsplashPhoto[]
  }
  return NextResponse.json({
    total:payload.total,
    totalPages:payload.total_pages,
    photos:payload.results.map(mapPhoto),
  })
}
export async function POST(request: NextRequest) {
  const session = await owner(request)
  if (!session) return NextResponse.json({ error:'unauthorized' },{ status:401 })
  if (!accessKey()) return NextResponse.json({ error:'unsplash_not_configured' },{ status:503 })

  const body = await request.json() as { id?:string }
  const id = body.id?.trim()
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error:'invalid_photo_id' },{ status:400 })
  }

  const response = await fetch('https://api.unsplash.com/photos/' + encodeURIComponent(id),{
    headers:headers(),
    cache:'no-store',
  })
  if (!response.ok) {
    return NextResponse.json({ error:'unsplash_photo_failed' },{ status:response.status })
  }
  const photo = await response.json() as UnsplashPhoto
  const storageKey = 'unsplash:' + photo.id
  let [asset] = await db.select().from(assets).where(eq(assets.storageKey,storageKey)).limit(1)
  const alt = photo.alt_description || photo.description || ('Photo by ' + photo.user.name)

  const downloadUrl=unsplashApiUrl(photo.links.download_location)
  if (!downloadUrl) {
    return NextResponse.json({ error:'unsplash_download_url_invalid' },{ status:502 })
  }
  const downloadResponse = await fetch(downloadUrl,{
    headers:headers(),
    cache:'no-store',
  })
  if (!downloadResponse.ok) {
    return NextResponse.json({ error:'unsplash_download_event_failed' },{ status:502 })
  }

  if (!asset) {
    ;[asset] = await db.insert(assets).values({
      storageKey,
      fileName:'unsplash-' + photo.id + '.jpg',
      mimeType:'image/unsplash',
      sizeBytes:0,
      publicUrl:photo.urls.regular,
      altEn:alt,
      altVi:alt,
      source:'unsplash',
      sourceUrl:withUtm(photo.links.html),
      creditName:photo.user.name,
      creditUrl:withUtm(photo.user.links.html),
      status:'ready',
    }).returning()
  }

  await db.insert(auditLogs).values({
    actorId:session.user.id,
    action:'asset.unsplash.select',
    entityType:'asset',
    entityId:asset.id,
    metadata:{ unsplashId:photo.id },
  })
  return NextResponse.json({
    asset:{
      id:asset.id,
      fileName:asset.fileName,
      publicUrl:asset.publicUrl,
      altEn:asset.altEn,
      altVi:asset.altVi,
      sizeBytes:asset.sizeBytes,
      source:asset.source,
      sourceUrl:asset.sourceUrl,
      creditName:asset.creditName,
      creditUrl:asset.creditUrl,
    },
  },{ status:201 })
}
