import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { assets, auditLogs } from '@/db/schema'
import { auth } from '@/lib/auth'
import { storeAsset } from '@/lib/assets'

function originAllowed(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  return origin === 'https://thaiduy.digital' || origin === 'http://localhost:3000'
}

async function owner(request: NextRequest) {
  if (!originAllowed(request)) return null
  const session = await auth.api.getSession({ headers: request.headers })
  const ownerEmail = process.env.CONTROL_OWNER_EMAIL?.trim().toLowerCase()
  if (!session?.user || !ownerEmail || session.user.email.toLowerCase() !== ownerEmail) return null
  return session
}

export async function POST(request: NextRequest) {
  const session = await owner(request)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'file_required' }, { status: 400 })

    const altEn = String(form.get('altEn') ?? '').slice(0, 500) || null
    const altVi = String(form.get('altVi') ?? '').slice(0, 500) || null
    const stored = await storeAsset(file)
    const [row] = await db.insert(assets).values({
      storageKey: stored.storageKey,
      fileName: file.name.slice(0, 500),
      mimeType: file.type,
      sizeBytes: file.size,
      publicUrl: stored.publicUrl,
      altEn,
      altVi,
      status: 'ready',
    }).returning()
    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: 'asset.upload',
      entityType: 'asset',
      entityId: row.id,
      metadata: { provider: stored.provider, mimeType: file.type, sizeBytes: file.size },
    })
    return NextResponse.json({ ok: true, asset: row }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'upload_failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
