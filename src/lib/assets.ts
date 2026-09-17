import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const allowed = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
  'application/pdf',
])

export const MAX_ASSET_BYTES = 12 * 1024 * 1024

export function assetProvider() {
  const configured = Boolean(
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET && (process.env.S3_ENDPOINT || process.env.R2_ACCOUNT_ID),
  )
  return configured ? 'r2' as const : 'local' as const
}

function extension(file: File) {
  const fromName = extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, '')
  if (fromName && fromName.length <= 8) return fromName
  return file.type === 'application/pdf' ? '.pdf' : ''
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

export async function storeAsset(file: File) {
  if (!allowed.has(file.type)) throw new Error('unsupported_asset_type')
  if (file.size <= 0 || file.size > MAX_ASSET_BYTES) throw new Error('invalid_asset_size')

  const prefix = (process.env.R2_PREFIX ?? 'thaiduy.digital').replace(/^\/+|\/+$/g, '')
  const storageKey = `${prefix}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}${extension(file)}`
  const bytes = Buffer.from(await file.arrayBuffer())

  if (assetProvider() === 'r2') {
    await r2Client().send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!, Key: storageKey, Body: bytes, ContentType: file.type,
    }))
    const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
    return { storageKey, publicUrl: base ? `${base}/${storageKey}` : null, provider: 'r2' as const }
  }
  const root = join(process.cwd(), 'public', 'media')
  const target = join(root, storageKey)
  await mkdir(join(target, '..'), { recursive: true })
  await writeFile(target, bytes)
  return { storageKey, publicUrl: `/media/${storageKey}`, provider: 'local' as const }
}

export async function deleteStoredAsset(storageKey: string) {
  if (assetProvider() === 'r2') {
    await r2Client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: storageKey }))
    return
  }
  const target = join(process.cwd(), 'public', 'media', storageKey)
  await rm(target, { force: true })
}
