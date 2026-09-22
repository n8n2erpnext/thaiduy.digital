import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const allowed = new Set([
  'image/jpeg','image/png','image/webp','image/avif','image/gif',
  'application/pdf',
])

const mimeByExtension:Record<string,string>={
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.png':'image/png',
  '.webp':'image/webp',
  '.avif':'image/avif',
  '.gif':'image/gif',
  '.pdf':'application/pdf',
}

const mimeAliases:Record<string,string>={
  'image/jpg':'image/jpeg',
  'image/x-png':'image/png',
}

export const MAX_ASSET_BYTES = 12 * 1024 * 1024

export function assetProvider() {
  const configured = Boolean(
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET && (process.env.S3_ENDPOINT || process.env.R2_ACCOUNT_ID),
  )
  return configured ? 'r2' as const : 'local' as const
}

function extension(file: File) {
  const fromName=extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g,'')
  if (fromName && fromName.length<=8) return fromName
  return file.type==='application/pdf'?'.pdf':''
}

function contentType(file:File) {
  const raw=(file.type ?? '').trim().toLowerCase()
  const normalized=mimeAliases[raw] ?? raw
  if (allowed.has(normalized)) return normalized

  const inferred=mimeByExtension[extension(file)]
  if (inferred && (!normalized || normalized==='application/octet-stream' || normalized.startsWith('image/'))) {
    return inferred
  }
  throw new Error('unsupported_asset_type')
}

function publicBaseUrl() {
  const base=process.env.R2_PUBLIC_URL?.trim().replace(/\/$/,'')
  if (!base) throw new Error('r2_public_url_missing')
  try {
    const parsed=new URL(base)
    if (parsed.protocol!=='https:' && parsed.protocol!=='http:') throw new Error()
  } catch {
    throw new Error('r2_public_url_invalid')
  }
  return base
}

function r2Client() {
  const endpoint = process.env.S3_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

export async function storeAsset(file:File) {
  const mimeType=contentType(file)
  if (file.size<=0 || file.size>MAX_ASSET_BYTES) throw new Error('invalid_asset_size')

  const prefix=(process.env.R2_PREFIX ?? 'thaiduy.digital').replace(/^\/+|\/+$/g,'')
  const storageKey=`${prefix}/${new Date().toISOString().slice(0,7)}/${randomUUID()}${extension(file)}`
  const bytes=Buffer.from(await file.arrayBuffer())

  if (assetProvider()==='r2') {
    const base=publicBaseUrl()
    const client=r2Client()
    try {
      await client.send(new PutObjectCommand({
        Bucket:process.env.R2_BUCKET!,
        Key:storageKey,
        Body:bytes,
        ContentType:mimeType,
        CacheControl:'public, max-age=31536000, immutable',
      }))
    } catch {
      throw new Error('r2_upload_failed')
    }

    try {
      const verified=await client.send(new HeadObjectCommand({
        Bucket:process.env.R2_BUCKET!,
        Key:storageKey,
      }))
      if (Number(verified.ContentLength ?? -1)!==bytes.length) throw new Error()
    } catch {
      await client.send(new DeleteObjectCommand({
        Bucket:process.env.R2_BUCKET!,
        Key:storageKey,
      })).catch(()=>undefined)
      throw new Error('r2_verify_failed')
    }

    return {
      storageKey,
      publicUrl:`${base}/${storageKey}`,
      provider:'r2' as const,
      mimeType,
    }
  }

  const root=join(process.cwd(),'public','media')
  const target=join(root,storageKey)
  await mkdir(join(target,'..'),{recursive:true})
  await writeFile(target,bytes)
  return {
    storageKey,
    publicUrl:`/media/${storageKey}`,
    provider:'local' as const,
    mimeType,
  }
}

export async function deleteStoredAsset(storageKey: string) {
  if (assetProvider() === 'r2') {
    await r2Client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: storageKey }))
    return
  }
  const target = join(process.cwd(), 'public', 'media', storageKey)
  await rm(target, { force: true })
}
