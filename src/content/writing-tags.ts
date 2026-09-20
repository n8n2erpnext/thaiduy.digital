import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { auditLogs, posts, revisions, writingTags } from '@/db/schema'

export type WritingTag = typeof writingTags.$inferSelect
export type WritingTagPublic = Pick<WritingTag,'id'|'slug'|'name'|'color'|'textColor'|'enabled'>

export function normalizeTagSlug(value:string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
    .slice(0,64)
}

export function normalizeTagColor(value:string) {
  const color=value.trim().toUpperCase()
  if (!/^#[0-9A-F]{6}$/.test(color)) throw new Error('tag_color_invalid')
  return color
}

export function readableTagText(color:string) {
  const hex=normalizeTagColor(color).slice(1)
  const rgb=[0,2,4].map(offset=>Number.parseInt(hex.slice(offset,offset+2),16)/255)
  const linear=rgb.map(channel=>channel<=.04045 ? channel/12.92 : Math.pow((channel+.055)/1.055,2.4))
  const luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2]
  return luminance>.43 ? '#172019' : '#F7FAF8'
}

export async function getWritingTags(options?:{ includeDisabled?:boolean }) {
  const rows=await db.select().from(writingTags).orderBy(asc(writingTags.name))
  return options?.includeDisabled ? rows : rows.filter(tag=>tag.enabled)
}

export async function getWritingTagUsage() {
  const [tagRows,postRows]=await Promise.all([
    getWritingTags({includeDisabled:true}),
    db.select({ tags:posts.tags }).from(posts),
  ])
  const usage=new Map<string,number>()
  for (const post of postRows) {
    for (const slug of post.tags) usage.set(slug,(usage.get(slug)??0)+1)
  }
  return tagRows.map(tag=>({ ...tag, usage:usage.get(tag.slug)??0 }))
}

export async function createWritingTag(input:{ name:string;color:string },actorId:string) {
  const name=input.name.trim().replace(/\s+/g,' ').slice(0,64)
  const slug=normalizeTagSlug(name)
  if (!name || !slug) throw new Error('tag_name_required')
  const color=normalizeTagColor(input.color)
  const textColor=readableTagText(color)
  return db.transaction(async tx=>{
    const [existing]=await tx.select({id:writingTags.id}).from(writingTags).where(eq(writingTags.slug,slug)).limit(1)
    if (existing) throw new Error('tag_slug_exists')
    const [created]=await tx.insert(writingTags).values({name,slug,color,textColor}).returning()
    await tx.insert(revisions).values({
      entityType:'writing_tag',entityId:created.id,action:'create',after:created,actorId,
    })
    await tx.insert(auditLogs).values({
      actorId,action:'writing_tag.create',entityType:'writing_tag',entityId:created.id,
      metadata:{slug:created.slug,color:created.color},
    })
    return created
  })
}

export async function updateWritingTag(
  id:string,
  input:{ name:string;color:string;enabled:boolean },
  actorId:string,
) {
  const name=input.name.trim().replace(/\s+/g,' ').slice(0,64)
  if (!name) throw new Error('tag_name_required')
  const color=normalizeTagColor(input.color)
  const textColor=readableTagText(color)
  return db.transaction(async tx=>{
    const [before]=await tx.select().from(writingTags).where(eq(writingTags.id,id)).limit(1)
    if (!before) throw new Error('tag_not_found')
    const [after]=await tx.update(writingTags).set({
      name,color,textColor,enabled:input.enabled,updatedAt:new Date(),
    }).where(eq(writingTags.id,id)).returning()
    await tx.insert(revisions).values({
      entityType:'writing_tag',entityId:id,action:'update',before,after,actorId,
    })
    await tx.insert(auditLogs).values({
      actorId,action:'writing_tag.update',entityType:'writing_tag',entityId:id,
      metadata:{slug:after.slug,color:after.color,enabled:after.enabled},
    })
    return after
  })
}
