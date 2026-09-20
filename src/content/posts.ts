import { and, desc, eq, inArray, isNull, ne } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'
import { db } from '@/db/client'
import { assets, auditLogs, posts, revisions, writingTags } from '@/db/schema'

export type PostStatus = 'draft' | 'published' | 'archived'
export type PostRow = typeof posts.$inferSelect & {
  coverUrl?: string | null
  coverAltEn?: string | null
  coverAltVi?: string | null
  coverSource?: string | null
  coverSourceUrl?: string | null
  coverCreditName?: string | null
  coverCreditUrl?: string | null
  tagRecords: Array<typeof writingTags.$inferSelect>
}

const cleanOptions: sanitizeHtml.IOptions = {
  allowedTags:[
    'p','h2','h3','h4','strong','em','s','blockquote','ul','ol','li',
    'a','img','hr','br','code','pre',
  ],
  allowedAttributes:{
    a:['href','target','rel'],
    img:['src','alt','title'],
    code:['class'],
  },
  allowedSchemes:['http','https','mailto'],
  allowedSchemesByTag:{ img:['http','https'] },
  transformTags:{
    a:(_tag, attrs) => ({
      tagName:'a',
      attribs:{ ...attrs, rel:'noopener noreferrer' },
    }),
  },
}
export function sanitizePostHtml(value: string) {
  return sanitizeHtml(value, cleanOptions)
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180)
}

async function withCover(rows: Array<typeof posts.$inferSelect>): Promise<PostRow[]> {
  if (!rows.length) return []
  const [assetRows,tagRows] = await Promise.all([
    db.select().from(assets),
    db.select().from(writingTags),
  ])
  const byId = new Map(assetRows.map(asset => [asset.id, asset]))
  const tagsBySlug = new Map(tagRows.map(tag => [tag.slug,tag]))
  return rows.map(row => {
    const cover = row.coverAssetId ? byId.get(row.coverAssetId) : undefined
    return {
      ...row,
      coverUrl:cover?.publicUrl ?? null,
      coverAltEn:cover?.altEn ?? null,
      coverAltVi:cover?.altVi ?? null,
      coverSource:cover?.source ?? null,
      coverSourceUrl:cover?.sourceUrl ?? null,
      coverCreditName:cover?.creditName ?? null,
      coverCreditUrl:cover?.creditUrl ?? null,
      tagRecords:row.tags.flatMap(slug => {
        const tag=tagsBySlug.get(slug)
        return tag ? [tag] : []
      }),
    }
  })
}
export async function getPostsAdmin() {
  const rows = await db.select().from(posts).orderBy(desc(posts.updatedAt))
  return withCover(rows)
}

export async function getPostAdmin(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id,id)).limit(1)
  if (!row) return null
  return (await withCover([row]))[0]
}

export async function getPublishedPosts() {
  const rows = await db.select().from(posts).where(and(
    eq(posts.status,'published'),
    isNull(posts.deletedAt),
  )).orderBy(desc(posts.publishedAt), desc(posts.updatedAt))
  return withCover(rows)
}

export async function getPublishedPostBySlug(slug: string) {
  const [row] = await db.select().from(posts).where(and(
    eq(posts.slug,slug),
    eq(posts.status,'published'),
    isNull(posts.deletedAt),
  )).limit(1)
  if (!row) return null
  return (await withCover([row]))[0]
}
type SavePostInput = {
  slug:string
  status:PostStatus
  titleEn:string
  titleVi:string
  excerptEn:string | null
  excerptVi:string | null
  bodyEn:string
  bodyVi:string
  coverAssetId:string | null
  seoTitleEn:string | null
  seoTitleVi:string | null
  seoDescriptionEn:string | null
  seoDescriptionVi:string | null
  highlight:boolean
  tags:string[]
}

export async function savePost(input: SavePostInput, actorId: string, id?: string) {
  const slug = normalizeSlug(input.slug || input.titleEn || input.titleVi)
  if (!slug) throw new Error('post_slug_required')
  const tagSlugs=[...new Set(input.tags)].slice(0,8)
  if (tagSlugs.length) {
    const validTags=await db.select({slug:writingTags.slug}).from(writingTags).where(and(
      inArray(writingTags.slug,tagSlugs),
      eq(writingTags.enabled,true),
    ))
    if (validTags.length!==tagSlugs.length) throw new Error('post_tag_invalid')
  }
  const duplicate = await db.select({ id:posts.id }).from(posts)
    .where(id ? and(eq(posts.slug,slug),ne(posts.id,id)) : eq(posts.slug,slug))
    .limit(1)
  if (duplicate.length) throw new Error('post_slug_exists')

  return db.transaction(async tx => {
    const now = new Date()
    const data = {
      ...input,
      tags:tagSlugs,
      slug,
      bodyEn:sanitizePostHtml(input.bodyEn),
      bodyVi:sanitizePostHtml(input.bodyVi),
      authorId:actorId,
      updatedAt:now,
    }
    if (id) {
      const [before] = await tx.select().from(posts).where(eq(posts.id,id)).limit(1)
      if (!before) throw new Error('post_not_found')
      const [after] = await tx.update(posts).set({
        ...data,
        publishedAt:input.status === 'published' ? before.publishedAt ?? now : before.publishedAt,
      }).where(eq(posts.id,id)).returning()
      await tx.insert(revisions).values({
        entityType:'post', entityId:id, action:'update', before, after, actorId,
      })
      await tx.insert(auditLogs).values({
        actorId, action:'post.update', entityType:'post', entityId:id,
        metadata:{ slug:after.slug, status:after.status },
      })
      return after
    }

    const [created] = await tx.insert(posts).values({
      ...data,
      publishedAt:input.status === 'published' ? now : null,
      createdAt:now,
    }).returning()
    await tx.insert(revisions).values({
      entityType:'post', entityId:created.id, action:'create', after:created, actorId,
    })
    await tx.insert(auditLogs).values({
      actorId, action:'post.create', entityType:'post', entityId:created.id,
      metadata:{ slug:created.slug, status:created.status },
    })
    return created
  })
}
export async function setPostHighlight(id:string, highlight:boolean, actorId:string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(posts).where(eq(posts.id,id)).limit(1)
    if (!before) throw new Error('post_not_found')
    const [after] = await tx.update(posts).set({
      highlight,
      updatedAt:new Date(),
    }).where(eq(posts.id,id)).returning()
    await tx.insert(revisions).values({
      entityType:'post', entityId:id, action:'highlight', before, after, actorId,
    })
    await tx.insert(auditLogs).values({
      actorId, action:'post.highlight', entityType:'post', entityId:id,
      metadata:{ slug:after.slug, highlight },
    })
    return after
  })
}

export async function setPostStatus(id: string, status: PostStatus, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(posts).where(eq(posts.id,id)).limit(1)
    if (!before) throw new Error('post_not_found')
    const now = new Date()
    const [after] = await tx.update(posts).set({
      status,
      publishedAt:status === 'published' ? before.publishedAt ?? now : before.publishedAt,
      updatedAt:now,
    }).where(eq(posts.id,id)).returning()
    await tx.insert(revisions).values({
      entityType:'post', entityId:id, action:'status', before, after, actorId,
    })
    await tx.insert(auditLogs).values({
      actorId, action:'post.status', entityType:'post', entityId:id,
      metadata:{ slug:after.slug, status },
    })
    return after
  })
}

export async function trashPost(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(posts).where(eq(posts.id,id)).limit(1)
    if (!before) throw new Error('post_not_found')
    const [after] = await tx.update(posts).set({
      deletedAt:new Date(), status:'archived', updatedAt:new Date(),
    }).where(eq(posts.id,id)).returning()
    await tx.insert(revisions).values({
      entityType:'post', entityId:id, action:'delete', before, after, actorId,
    })
    await tx.insert(auditLogs).values({
      actorId, action:'post.delete', entityType:'post', entityId:id,
      metadata:{ slug:after.slug },
    })
    return after
  })
}

export async function restorePost(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(posts).where(eq(posts.id,id)).limit(1)
    if (!before) throw new Error('post_not_found')
    const [after] = await tx.update(posts).set({
      deletedAt:null, status:'draft', updatedAt:new Date(),
    }).where(eq(posts.id,id)).returning()
    await tx.insert(revisions).values({
      entityType:'post', entityId:id, action:'restore', before, after, actorId,
    })
    await tx.insert(auditLogs).values({
      actorId, action:'post.restore', entityType:'post', entityId:id,
      metadata:{ slug:after.slug },
    })
    return after
  })
}

export async function purgePost(id: string, actorId: string) {
  return db.transaction(async tx => {
    const [before] = await tx.select().from(posts).where(eq(posts.id,id)).limit(1)
    if (!before) return
    await tx.delete(posts).where(eq(posts.id,id))
    await tx.insert(auditLogs).values({
      actorId, action:'post.purge', entityType:'post', entityId:id,
      metadata:{ slug:before.slug },
    })
  })
}

export function localizedPost(post: PostRow, locale: 'en' | 'vi') {
  const primary = locale === 'vi'
  return {
    title:primary ? post.titleVi || post.titleEn : post.titleEn || post.titleVi,
    excerpt:primary ? post.excerptVi || post.excerptEn : post.excerptEn || post.excerptVi,
    body:primary ? post.bodyVi || post.bodyEn : post.bodyEn || post.bodyVi,
    seoTitle:primary ? post.seoTitleVi || post.seoTitleEn : post.seoTitleEn || post.seoTitleVi,
    seoDescription:primary
      ? post.seoDescriptionVi || post.seoDescriptionEn || post.excerptVi || post.excerptEn
      : post.seoDescriptionEn || post.seoDescriptionVi || post.excerptEn || post.excerptVi,
    coverAlt:primary ? post.coverAltVi || post.coverAltEn : post.coverAltEn || post.coverAltVi,
    coverSource:post.coverSource,
    coverSourceUrl:post.coverSourceUrl,
    coverCreditName:post.coverCreditName,
    coverCreditUrl:post.coverCreditUrl,
    highlight:post.highlight,
    tags:post.tags,
  }
}
