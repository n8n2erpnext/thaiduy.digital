'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  getRegistryByKey,
  getRegistryItem,
  purgeRegistry,
  restoreRegistry,
  saveRegistryItem,
  setRegistryEnabled,
  softDeleteRegistry,
} from '@/content/repository'
import { requireControlOwner } from '@/lib/control-auth'

const statusSchema = z.enum(['draft','published','archived'])

function text(form: FormData,key: string,max = 4000) {
  return String(form.get(key) ?? '').slice(0,max).trim()
}

function projectKey(value: string) {
  return value.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
    .slice(0,128)
}

function refresh(key?:string) {
  revalidatePath('/projects')
  if (key) revalidatePath('/projects/' + key)
  revalidatePath('/control/content')
  revalidatePath('/control/content/projects')
}
export async function saveProjectAction(formData: FormData) {
  const session = await requireControlOwner()
  const idRaw = text(formData,'id',64)
  const id = idRaw ? z.uuid().parse(idRaw) : undefined
  const existing = id ? await getRegistryItem(id) : null
  if (existing && existing.kind !== 'project') throw new Error('not_a_project')

  const labelEn = text(formData,'labelEn',300)
  const labelVi = text(formData,'labelVi',300)
  if (!labelEn && !labelVi) throw new Error('project_name_required')

  const key = existing?.key ?? projectKey(labelEn || labelVi)
  if (!key) throw new Error('project_key_required')
  if (!existing) {
    const duplicate = await getRegistryByKey(key)
    if (duplicate) throw new Error('project_key_exists')
  }

  const plane = text(formData,'plane',120)
  const mode = text(formData,'mode',80)
  const meta = {
    ...(existing?.meta ?? {}),
    plane,
    mode,
    logoUrl:text(formData,'logoUrl',1200),
    overviewEn:text(formData,'overviewEn',12000),
    overviewVi:text(formData,'overviewVi',12000),
    highlightsEn:text(formData,'highlightsEn',8000),
    highlightsVi:text(formData,'highlightsVi',8000),
    architectureEn:text(formData,'architectureEn',12000),
    architectureVi:text(formData,'architectureVi',12000),
    websiteUrl:text(formData,'websiteUrl',1200),
    demoUrl:text(formData,'demoUrl',1200),
    githubUrl:text(formData,'githubUrl',1200),
    docsUrl:text(formData,'docsUrl',1200),
  }
  const saved = await saveRegistryItem({
    key,
    kind:'project',
    enabled:formData.get('enabled') === 'on',
    status:statusSchema.parse(text(formData,'status',16) || 'draft'),
    sort:z.coerce.number().int().min(-9999).max(9999).parse(formData.get('sort') ?? 0),
    parentKey:null,
    labelEn:labelEn || labelVi,
    labelVi:labelVi || labelEn,
    titleEn:text(formData,'titleEn',600) || null,
    titleVi:text(formData,'titleVi',600) || null,
    summaryEn:text(formData,'summaryEn',5000) || null,
    summaryVi:text(formData,'summaryVi',5000) || null,
    runtimeKey:existing?.runtimeKey ?? key,
    meta,
  },session.user.id,id)

  refresh(saved.key)
  redirect('/control/content/projects/' + saved.id + '?saved=1')
}

export async function toggleProjectAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const item = await getRegistryItem(id)
  if (!item || item.kind !== 'project') throw new Error('project_not_found')
  await setRegistryEnabled(id,formData.get('enabled') === 'true',session.user.id)
  refresh(item.key)
}
export async function trashProjectAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const item = await getRegistryItem(id)
  if (!item || item.kind !== 'project') throw new Error('project_not_found')
  await softDeleteRegistry(id,session.user.id)
  refresh(item.key)
  redirect('/control/content/projects')
}

export async function restoreProjectAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const item = await getRegistryItem(id)
  if (!item || item.kind !== 'project') throw new Error('project_not_found')
  await restoreRegistry(id,session.user.id)
  refresh(item.key)
}

export async function purgeProjectAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const item = await getRegistryItem(id)
  if (!item || item.kind !== 'project') throw new Error('project_not_found')
  await purgeRegistry(id,session.user.id)
  refresh(item.key)
}