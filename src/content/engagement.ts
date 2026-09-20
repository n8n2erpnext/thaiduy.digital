import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { articleComments,articleLikes,auditLogs,posts } from '@/db/schema'
import { account,user } from '@/db/auth-schema'

export type PublicComment = {
  id:string
  body:string
  createdAt:Date
  authorName:string
  authorImage:string | null
}

export async function hasGoogleAccount(userId: string) {
  const [row] = await db.select({ id:account.id })
    .from(account)
    .where(and(eq(account.userId,userId),eq(account.providerId,'google')))
    .limit(1)
  return Boolean(row)
}

export async function getArticleEngagement(postId: string,userId?: string | null) {
  const [[likes],comments,likedRows] = await Promise.all([
    db.select({ value:count() }).from(articleLikes).where(eq(articleLikes.postId,postId)),
    db.select({
      id:articleComments.id,
      body:articleComments.body,
      createdAt:articleComments.createdAt,
      authorName:user.name,
      authorImage:user.image,
    })
      .from(articleComments)
      .innerJoin(user,eq(articleComments.userId,user.id))
      .where(and(
        eq(articleComments.postId,postId),
        eq(articleComments.status,'approved'),
        isNull(articleComments.deletedAt),
      ))
      .orderBy(articleComments.createdAt),
    userId
      ? db.select({ id:articleLikes.id }).from(articleLikes)
          .where(and(eq(articleLikes.postId,postId),eq(articleLikes.userId,userId))).limit(1)
      : Promise.resolve([]),
  ])
  return {
    likeCount:Number(likes?.value ?? 0),
    liked:likedRows.length > 0,
    comments:comments as PublicComment[],
  }
}
export async function toggleArticleLike(postId: string,userId: string) {
  const [existing] = await db.select({ id:articleLikes.id }).from(articleLikes)
    .where(and(eq(articleLikes.postId,postId),eq(articleLikes.userId,userId))).limit(1)
  if (existing) {
    await db.delete(articleLikes).where(eq(articleLikes.id,existing.id))
  } else {
    await db.insert(articleLikes).values({ postId,userId })
  }
  const [row] = await db.select({ value:count() }).from(articleLikes)
    .where(eq(articleLikes.postId,postId))
  return { liked:!existing,likeCount:Number(row?.value ?? 0) }
}

export async function submitArticleComment(postId: string,userId: string,rawBody: string) {
  const body = rawBody.trim().replace(/\r\n/g,'\n')
  if (body.length < 2 || body.length > 3000) throw new Error('comment_length_invalid')

  const [last] = await db.select({ createdAt:articleComments.createdAt })
    .from(articleComments)
    .where(and(eq(articleComments.postId,postId),eq(articleComments.userId,userId)))
    .orderBy(desc(articleComments.createdAt))
    .limit(1)
  if (last && Date.now() - last.createdAt.getTime() < 30_000) {
    throw new Error('comment_rate_limited')
  }

  const [created] = await db.insert(articleComments).values({
    postId,userId,body,status:'pending',
  }).returning({ id:articleComments.id,status:articleComments.status })
  return created
}
export async function getWritingModerationQueue() {
  return db.select({
    id:articleComments.id,
    body:articleComments.body,
    status:articleComments.status,
    createdAt:articleComments.createdAt,
    moderatedAt:articleComments.moderatedAt,
    postId:articleComments.postId,
    postSlug:posts.slug,
    postTitleEn:posts.titleEn,
    postTitleVi:posts.titleVi,
    userId:articleComments.userId,
    authorName:user.name,
    authorEmail:user.email,
    authorImage:user.image,
  })
    .from(articleComments)
    .innerJoin(posts,eq(articleComments.postId,posts.id))
    .innerJoin(user,eq(articleComments.userId,user.id))
    .where(isNull(articleComments.deletedAt))
    .orderBy(
      sql`case
        when ${articleComments.status} = 'pending' then 0
        when ${articleComments.status} = 'approved' then 1
        else 2
      end`,
      desc(articleComments.createdAt),
    )
}

export async function countPendingComments() {
  const [row] = await db.select({ value:count() }).from(articleComments)
    .where(and(eq(articleComments.status,'pending'),isNull(articleComments.deletedAt)))
  return Number(row?.value ?? 0)
}
export async function moderateArticleComment(
  id:string,
  status:'approved'|'rejected',
  moderatorId:string,
) {
  const [row] = await db.update(articleComments).set({
    status,
    moderatedBy:moderatorId,
    moderatedAt:new Date(),
    updatedAt:new Date(),
  }).where(eq(articleComments.id,id)).returning()
  if (!row) throw new Error('comment_not_found')
  await db.insert(auditLogs).values({
    actorId:moderatorId,
    action:'comment.' + status,
    entityType:'article_comment',
    entityId:id,
    metadata:{ postId:row.postId,userId:row.userId },
  })
  return row
}

export async function trashArticleComment(id:string,moderatorId:string) {
  const [row] = await db.update(articleComments).set({
    deletedAt:new Date(),
    moderatedBy:moderatorId,
    moderatedAt:new Date(),
    updatedAt:new Date(),
  }).where(eq(articleComments.id,id)).returning()
  if (!row) throw new Error('comment_not_found')
  await db.insert(auditLogs).values({
    actorId:moderatorId,
    action:'comment.trash',
    entityType:'article_comment',
    entityId:id,
    metadata:{ postId:row.postId,userId:row.userId },
  })
  return row
}
