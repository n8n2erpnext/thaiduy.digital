import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { assets, auditLogs } from '@/db/schema'
import { getControlIdentityFromHeaders } from '@/lib/control-auth'
import { storeAsset } from '@/lib/assets'
import { requestOriginAllowed } from '@/lib/request-security'

async function owner(request: NextRequest) {
  if (!requestOriginAllowed(request)) return null
  const identity=await getControlIdentityFromHeaders(request.headers)
  return identity.state==='owner' ? identity.session : null
}

export async function GET(request: NextRequest) {
  const session = await owner(request)
  if (!session) return NextResponse.json({ error:'unauthorized' }, { status:401 })
  const rows = await db.select({
    id:assets.id,
    fileName:assets.fileName,
    mimeType:assets.mimeType,
    sizeBytes:assets.sizeBytes,
    publicUrl:assets.publicUrl,
    altEn:assets.altEn,
    altVi:assets.altVi,
    source:assets.source,
    sourceUrl:assets.sourceUrl,
    creditName:assets.creditName,
    creditUrl:assets.creditUrl,
    createdAt:assets.createdAt,
  }).from(assets).where(and(
    eq(assets.status,'ready'),
    isNull(assets.deletedAt),
  )).orderBy(desc(assets.createdAt))

  return NextResponse.json({
    assets:rows.filter(row => row.mimeType.startsWith('image/') && row.publicUrl),
  })
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
      mimeType: stored.mimeType,
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
      metadata: { provider: stored.provider, mimeType: stored.mimeType, sizeBytes: file.size },
    })
    return NextResponse.json({
      ok:true,
      asset:row,
      provider:stored.provider,
    },{status:201})
  } catch (error) {
    const code=error instanceof Error?error.message:'asset_upload_failed'
    const known=new Set([
      'unsupported_asset_type',
      'invalid_asset_size',
      'r2_public_url_missing',
      'r2_public_url_invalid',
      'r2_upload_failed',
      'r2_verify_failed',
    ])
    const safeCode=known.has(code)?code:'asset_upload_failed'
    const status=
      safeCode==='unsupported_asset_type'?415:
      safeCode==='invalid_asset_size'?413:
      safeCode.startsWith('r2_')?502:500
    console.error('[asset.upload.failed]',{
      code:safeCode,
      name:error instanceof Error?error.name:'unknown',
    })
    return NextResponse.json({ error:safeCode }, { status })
  }
}
