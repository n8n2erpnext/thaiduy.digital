'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  purgePost,
  restorePost,
  savePost,
  setPostHighlight,
  setPostStatus,
  trashPost,
  type PostStatus,
} from '@/content/posts'
import { requireControlOwner } from '@/lib/control-auth'

const statusSchema = z.enum(['draft','published','archived'])

function text(form: FormData, key: string, max = 200_000) {
  return String(form.get(key) ?? '').slice(0,max)
}

function optional(form: FormData, key: string, max = 2_000) {
  const value = text(form,key,max).trim()
  return value || null
}

function tags(form:FormData) {
  const seen=new Set<string>()
  return form.getAll('tags')
    .map(value=>String(value).trim().toLowerCase())
    .filter(value=>/^[a-z0-9][a-z0-9-]{0,63}$/.test(value))
    .filter(value=>{
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
    .slice(0,8)
}

function refresh(slug?: string) {
  revalidatePath('/control/content')
  revalidatePath('/control/content/writing')
  revalidatePath('/control/content/tags')
  revalidatePath('/writing')
  if (slug) revalidatePath('/writing/' + slug)
}

export async function savePostAction(formData: FormData) {
  const session = await requireControlOwner()
  const idRaw = text(formData,'id',64).trim()
  const id = idRaw ? z.uuid().parse(idRaw) : undefined
  const status = statusSchema.parse(text(formData,'status',16) || 'draft')
  const coverRaw = text(formData,'coverAssetId',64).trim()

  const saved = await savePost({
    slug:text(formData,'slug',180),
    status,
    titleEn:text(formData,'titleEn',500).trim(),
    titleVi:text(formData,'titleVi',500).trim(),
    excerptEn:optional(formData,'excerptEn',2_000),
    excerptVi:optional(formData,'excerptVi',2_000),
    bodyEn:text(formData,'bodyEn'),
    bodyVi:text(formData,'bodyVi'),
    coverAssetId:coverRaw ? z.uuid().parse(coverRaw) : null,
    seoTitleEn:optional(formData,'seoTitleEn',500),
    seoTitleVi:optional(formData,'seoTitleVi',500),
    seoDescriptionEn:optional(formData,'seoDescriptionEn',1_000),
    seoDescriptionVi:optional(formData,'seoDescriptionVi',1_000),
    highlight:formData.get('highlight') === 'on',
    tags:tags(formData),
  }, session.user.id, id)

  refresh(saved.slug)
  redirect('/control/content/writing/' + saved.id + '?saved=1')
}

export async function changePostHighlightAction(formData:FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const highlight = text(formData,'highlight',8) === 'true'
  const post = await setPostHighlight(id,highlight,session.user.id)
  refresh(post.slug)
}

export async function changePostStatusAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const status = statusSchema.parse(text(formData,'status',16)) as PostStatus
  const post = await setPostStatus(id,status,session.user.id)
  refresh(post.slug)
}
export async function trashPostAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const post = await trashPost(id,session.user.id)
  refresh(post.slug)
  redirect('/control/content/writing')
}

export async function restorePostAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  const post = await restorePost(id,session.user.id)
  refresh(post.slug)
}

export async function purgePostAction(formData: FormData) {
  const session = await requireControlOwner()
  const id = z.uuid().parse(text(formData,'id',64))
  await purgePost(id,session.user.id)
  refresh()
}
