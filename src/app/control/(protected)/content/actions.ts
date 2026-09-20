'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { purgeRegistry, restoreRegistry, saveRegistryItem, setRegistryEnabled, softDeleteRegistry } from '@/content/repository'
import { requireControlOwner } from '@/lib/control-auth'

const kindSchema = z.enum(['nav', 'stack-node', 'home-surface', 'section', 'feature', 'organ'])
const statusSchema = z.enum(['draft', 'published', 'archived'])

function refreshPublic() {
  for (const path of ['/', '/projects', '/writing', '/stack', '/about', '/music-sensor', '/control', '/control/content']) revalidatePath(path)
}

function parseMeta(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  if (!text) return {}
  const parsed = JSON.parse(text)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Meta must be a JSON object')
  return parsed as Record<string, unknown>
}

export async function saveRegistryAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = String(formData.get('id') ?? '').trim() || undefined
  const input = {
    key: z.string().min(1).max(128).parse(String(formData.get('key') ?? '').trim()),
    kind: kindSchema.parse(String(formData.get('kind') ?? 'section')),
    enabled: formData.get('enabled') === 'on',
    status: statusSchema.parse(String(formData.get('status') ?? 'draft')),
    sort: z.coerce.number().int().min(-9999).max(9999).parse(formData.get('sort') ?? 0),
    parentKey: String(formData.get('parentKey') ?? '').trim() || null,
    labelEn: z.string().min(1).parse(String(formData.get('labelEn') ?? '').trim()),
    labelVi: z.string().min(1).parse(String(formData.get('labelVi') ?? '').trim()),
    titleEn: String(formData.get('titleEn') ?? '').trim() || null,
    titleVi: String(formData.get('titleVi') ?? '').trim() || null,
    summaryEn: String(formData.get('summaryEn') ?? '').trim() || null,
    summaryVi: String(formData.get('summaryVi') ?? '').trim() || null,
    runtimeKey: String(formData.get('runtimeKey') ?? '').trim() || null,
    meta: parseMeta(formData.get('meta')),
  }
  const saved = await saveRegistryItem(input, session.user.id, id)
  refreshPublic()
  redirect(`/control/content/${saved.id}?saved=1`)
}

export async function toggleRegistryAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))
  const enabled = formData.get('enabled') === 'true'
  await setRegistryEnabled(id, enabled, session.user.id)
  refreshPublic()
}
export async function trashRegistryAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))
  await softDeleteRegistry(id, session.user.id)
  refreshPublic()
  redirect('/control/content')
}

export async function restoreRegistryAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))
  await restoreRegistry(id, session.user.id)
  refreshPublic()
}

export async function purgeRegistryAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(String(formData.get('id') ?? ''))
  await purgeRegistry(id, session.user.id)
  refreshPublic()
  redirect('/control/content')
}
