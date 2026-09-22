import { and,count,desc,eq,ilike,isNull,or,sql } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'
import { db } from '@/db/client'
import {
  auditLogs,
  communityMembers,
  communityReplies,
  communityReplyLikes,
  communityThreadLikes,
  communityThreads,
} from '@/db/schema'
import { account,user } from '@/db/auth-schema'
import type { CommunityReaction,CommunityReactionSummary } from '@/community/reactions'

export type CommunityStatus='pending'|'approved'|'rejected'|'hidden'
export type CommunityMemberStatus='active'|'blocked'
export type CommunityParticipant={
  id:string
  name:string
  image:string | null
  isAdmin:boolean
}

const controlOwnerEmail=(process.env.CONTROL_OWNER_EMAIL ?? '').trim().toLowerCase()

const communityHtmlOptions:sanitizeHtml.IOptions={
  allowedTags:[
    'p','h2','h3','strong','em','s','blockquote','ul','ol','li',
    'a','hr','br','code','pre','span',
  ],
  allowedAttributes:{
    a:['href','target','rel'],
    code:['class'],
    span:['class','data-mention-user-id','data-mention-label'],
  },
  allowedSchemes:['http','https','mailto'],
  transformTags:{
    a:(_tag,attrs)=>({
      tagName:'a',
      attribs:{...attrs,target:'_blank',rel:'noopener noreferrer'},
    }),
  },
}

export function sanitizeCommunityHtml(value:string) {
  return sanitizeHtml(value,communityHtmlOptions)
}

function plainTextFromHtml(value:string) {
  return sanitizeHtml(value,{allowedTags:[],allowedAttributes:{}})
    .replace(/\u00a0/g,' ')
    .replace(/[ \t]+\n/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim()
}

function mentionIdsFromHtml(value:string) {
  const ids=[...value.matchAll(/data-mention-user-id="([^"]+)"/g)].map(match=>match[1])
  return [...new Set(ids)]
}

function cleanBody(raw:string,max:number) {
  const body=raw.trim().replace(/\r\n/g,'\n')
  if (body.length < 2 || body.length > max) throw new Error('body_length_invalid')
  return body
}

function escapeHtml(value:string) {
  return value
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
}

function canonicalizeMentions(html:string,allowedMentions:Map<string,string>) {
  return html.replace(
    /<span[^>]*data-mention-user-id="([^"]+)"[^>]*>[\s\S]*?<\/span>/g,
    (_match,id:string)=>{
      const label=allowedMentions.get(id)
      if (!label) return ''
      return '<span class="discuss-mention" data-mention-user-id="'+escapeHtml(id)+'" data-mention-label="'+escapeHtml(label)+'">@'+escapeHtml(label)+'</span>'
    },
  )
}

async function normalizeCommunityBody(
  rawBody:string,
  rawBodyHtml:string | null | undefined,
  max:number,
  allowedMentions:Map<string,string>,
) {
  const sanitized=rawBodyHtml?.trim()?sanitizeCommunityHtml(rawBodyHtml):''
  const mentions=sanitized?mentionIdsFromHtml(sanitized):[]
  if (mentions.some(id=>!allowedMentions.has(id))) throw new Error('mention_not_allowed')
  const cleanedHtml=sanitized?canonicalizeMentions(sanitized,allowedMentions):''
  const text=cleanBody(cleanedHtml?plainTextFromHtml(cleanedHtml):rawBody,max)
  return {body:text,bodyHtml:cleanedHtml || null,mentions}
}

function adminFlag() {
  return controlOwnerEmail
    ? sql<boolean>`lower(${user.email})=${controlOwnerEmail}`
    : sql<boolean>`false`
}

export function isCommunityAdminEmail(email:string | null | undefined) {
  return Boolean(controlOwnerEmail && email?.trim().toLowerCase()===controlOwnerEmail)
}

export async function hasCommunityGoogleAccount(userId:string) {
  const [row]=await db.select({id:account.id}).from(account)
    .where(and(eq(account.userId,userId),eq(account.providerId,'google'))).limit(1)
  return Boolean(row)
}
export async function getCommunityMemberState(userId:string) {
  const [row]=await db.select().from(communityMembers)
    .where(eq(communityMembers.userId,userId)).limit(1)
  return row ?? null
}

export async function requireCommunityPostingAccess(userId:string) {
  if (!await hasCommunityGoogleAccount(userId)) throw new Error('google_required')
  const member=await getCommunityMemberState(userId)
  if (member?.status === 'blocked') throw new Error('community_blocked')
  await db.insert(communityMembers).values({userId,status:'active'})
    .onConflictDoNothing({target:communityMembers.userId})
}

export async function getCommunityParticipants(threadId:string):Promise<CommunityParticipant[]> {
  const rows=await db.execute(sql`
    select distinct
      u.id,
      u.name,
      u.image,
      case
        when ${controlOwnerEmail} <> '' and lower(u.email)=${controlOwnerEmail} then true
        else false
      end as "isAdmin"
    from "user" u
    join (
      select t.user_id
      from community_threads t
      where t.id=${threadId}
        and t.status='approved'
        and t.deleted_at is null
      union
      select r.user_id
      from community_replies r
      where r.thread_id=${threadId}
        and r.status='approved'
        and r.deleted_at is null
    ) participant on participant.user_id=u.id
    order by u.name asc
  `)
  return rows as unknown as CommunityParticipant[]
}

export async function getPublicCommunityThreads(page=1,limit=10,q='') {
  const safeLimit=Math.min(30,Math.max(1,limit))
  const safePage=Math.max(1,Number.isFinite(page)?Math.floor(page):1)
  const term=q.trim().slice(0,100)
  const publicWhere=and(
    eq(communityThreads.status,'approved'),
    isNull(communityThreads.deletedAt),
    term
      ? or(
          ilike(communityThreads.title,'%'+term+'%'),
          ilike(communityThreads.body,'%'+term+'%'),
        )
      : undefined,
  )
  const [countRow]=await db.select({value:count()}).from(communityThreads).where(publicWhere)
  const total=Number(countRow?.value ?? 0)
  const pages=Math.max(1,Math.ceil(total/safeLimit))
  const currentPage=Math.min(safePage,pages)

  const items=await db.select({
    id:communityThreads.id,
    title:communityThreads.title,
    body:communityThreads.body,
    locale:communityThreads.locale,
    pinned:communityThreads.pinned,
    locked:communityThreads.locked,
    createdAt:communityThreads.createdAt,
    lastActivityAt:communityThreads.lastActivityAt,
    authorName:user.name,
    authorImage:user.image,
    isAdmin:adminFlag(),
    replyCount:sql<number>`(
      select count(*)::int from community_replies r
      where r.thread_id = ${communityThreads.id}
        and r.status = 'approved' and r.deleted_at is null
    )`,
    likeCount:sql<number>`(
      select count(*)::int from community_thread_likes l
      where l.thread_id = ${communityThreads.id}
    )`,
  })
    .from(communityThreads)
    .innerJoin(user,eq(communityThreads.userId,user.id))
    .where(publicWhere)
    .orderBy(desc(communityThreads.pinned),desc(communityThreads.lastActivityAt))
    .limit(safeLimit)
    .offset((currentPage-1)*safeLimit)

  return {items,total,page:currentPage,pages,limit:safeLimit,q:term}
}

export async function getPublicCommunityThread(
  id:string,
  userId?:string | null,
  replyPage=1,
  replyLimit=20,
) {
  const safeLimit=Math.min(50,Math.max(1,replyLimit))
  const safePage=Math.max(1,Number.isFinite(replyPage)?Math.floor(replyPage):1)
  const threadReaction=userId
    ? sql<CommunityReaction|null>`(
        select l.reaction
        from community_thread_likes l
        where l.thread_id=${communityThreads.id} and l.user_id=${userId}
        limit 1
      )`
    : sql<CommunityReaction|null>`null`
  const [thread]=await db.select({
    id:communityThreads.id,
    title:communityThreads.title,
    body:communityThreads.body,
    bodyHtml:communityThreads.bodyHtml,
    locale:communityThreads.locale,
    pinned:communityThreads.pinned,
    locked:communityThreads.locked,
    createdAt:communityThreads.createdAt,
    lastActivityAt:communityThreads.lastActivityAt,
    authorName:user.name,
    authorImage:user.image,
    isAdmin:adminFlag(),
    reactionCount:sql<number>`(
      select count(*)::int from community_thread_likes l
      where l.thread_id=${communityThreads.id}
    )`,
    reactionSummary:sql<CommunityReactionSummary>`jsonb_build_object(
      'like',(select count(*)::int from community_thread_likes l where l.thread_id=${communityThreads.id} and l.reaction='like'),
      'love',(select count(*)::int from community_thread_likes l where l.thread_id=${communityThreads.id} and l.reaction='love'),
      'haha',(select count(*)::int from community_thread_likes l where l.thread_id=${communityThreads.id} and l.reaction='haha'),
      'wow',(select count(*)::int from community_thread_likes l where l.thread_id=${communityThreads.id} and l.reaction='wow'),
      'sad',(select count(*)::int from community_thread_likes l where l.thread_id=${communityThreads.id} and l.reaction='sad')
    )`,
    myReaction:threadReaction,
  })
    .from(communityThreads)
    .innerJoin(user,eq(communityThreads.userId,user.id))
    .where(and(
      eq(communityThreads.id,id),
      eq(communityThreads.status,'approved'),
      isNull(communityThreads.deletedAt),
    ))
    .limit(1)
  if (!thread) return null

  const replyWhere=and(
    eq(communityReplies.threadId,id),
    eq(communityReplies.status,'approved'),
    isNull(communityReplies.deletedAt),
  )
  const [replyCountRow]=await db.select({value:count()}).from(communityReplies).where(replyWhere)
  const totalReplies=Number(replyCountRow?.value ?? 0)
  const replyPages=Math.max(1,Math.ceil(totalReplies/safeLimit))
  const currentReplyPage=Math.min(safePage,replyPages)

  const replyReaction=userId
    ? sql<CommunityReaction|null>`(
        select l.reaction
        from community_reply_likes l
        where l.reply_id=${communityReplies.id} and l.user_id=${userId}
        limit 1
      )`
    : sql<CommunityReaction|null>`null`

  const replies=await db.select({
    id:communityReplies.id,
    parentReplyId:communityReplies.parentReplyId,
    body:communityReplies.body,
    bodyHtml:communityReplies.bodyHtml,
    createdAt:communityReplies.createdAt,
    authorName:user.name,
    authorImage:user.image,
    isAdmin:adminFlag(),
    reactionCount:sql<number>`(
      select count(*)::int from community_reply_likes l
      where l.reply_id=${communityReplies.id}
    )`,
    reactionSummary:sql<CommunityReactionSummary>`jsonb_build_object(
      'like',(select count(*)::int from community_reply_likes l where l.reply_id=${communityReplies.id} and l.reaction='like'),
      'love',(select count(*)::int from community_reply_likes l where l.reply_id=${communityReplies.id} and l.reaction='love'),
      'haha',(select count(*)::int from community_reply_likes l where l.reply_id=${communityReplies.id} and l.reaction='haha'),
      'wow',(select count(*)::int from community_reply_likes l where l.reply_id=${communityReplies.id} and l.reaction='wow'),
      'sad',(select count(*)::int from community_reply_likes l where l.reply_id=${communityReplies.id} and l.reaction='sad')
    )`,
    myReaction:replyReaction,
    parentAuthorName:sql<string|null>`(
      select pu.name
      from community_replies pr
      join "user" pu on pu.id=pr.user_id
      where pr.id=${communityReplies.parentReplyId}
        and pr.status='approved'
        and pr.deleted_at is null
      limit 1
    )`,
    parentBody:sql<string|null>`(
      select pr.body
      from community_replies pr
      where pr.id=${communityReplies.parentReplyId}
        and pr.status='approved'
        and pr.deleted_at is null
      limit 1
    )`,
  })
    .from(communityReplies)
    .innerJoin(user,eq(communityReplies.userId,user.id))
    .where(replyWhere)
    .orderBy(communityReplies.createdAt)
    .limit(safeLimit)
    .offset((currentReplyPage-1)*safeLimit)

  return {
    thread,
    replies,
    replyPagination:{
      total:totalReplies,
      page:currentReplyPage,
      pages:replyPages,
      limit:safeLimit,
    },
  }
}

export async function submitCommunityThread(
  userId:string,
  rawTitle:string,
  rawBody:string,
  rawBodyHtml:string | null | undefined,
  locale:'en'|'vi',
) {
  await requireCommunityPostingAccess(userId)
  const title=rawTitle.trim().replace(/\s+/g,' ')
  if (title.length < 3 || title.length > 180) throw new Error('title_length_invalid')
  const normalized=await normalizeCommunityBody(
    rawBody,
    rawBodyHtml,
    5000,
    new Map(),
  )

  const [last]=await db.select({createdAt:communityThreads.createdAt})
    .from(communityThreads)
    .where(eq(communityThreads.userId,userId))
    .orderBy(desc(communityThreads.createdAt)).limit(1)
  if (last && Date.now()-last.createdAt.getTime()<60_000) {
    throw new Error('community_rate_limited')
  }
  const [created]=await db.insert(communityThreads).values({
    userId,
    title,
    body:normalized.body,
    bodyHtml:normalized.bodyHtml,
    mentions:normalized.mentions,
    locale,
    status:'pending',
  }).returning({id:communityThreads.id,status:communityThreads.status})
  return created
}

export async function submitCommunityReply(
  threadId:string,
  userId:string,
  rawBody:string,
  rawBodyHtml:string | null | undefined,
  parentReplyId?:string | null,
) {
  await requireCommunityPostingAccess(userId)
  const [thread]=await db.select({
    id:communityThreads.id,
    locked:communityThreads.locked,
  }).from(communityThreads)
    .where(and(
      eq(communityThreads.id,threadId),
      eq(communityThreads.status,'approved'),
      isNull(communityThreads.deletedAt),
    )).limit(1)
  if (!thread) throw new Error('thread_not_found')
  if (thread.locked) throw new Error('thread_locked')

  const participants=await getCommunityParticipants(threadId)
  const allowedMentions=new Map(participants.map(item=>[item.id,item.name]))
  const normalized=await normalizeCommunityBody(
    rawBody,
    rawBodyHtml,
    3000,
    allowedMentions,
  )

  if (parentReplyId) {
    const [parent]=await db.select({id:communityReplies.id}).from(communityReplies)
      .where(and(
        eq(communityReplies.id,parentReplyId),
        eq(communityReplies.threadId,threadId),
        eq(communityReplies.status,'approved'),
        isNull(communityReplies.deletedAt),
      )).limit(1)
    if (!parent) throw new Error('parent_reply_not_found')
  }

  const [last]=await db.select({createdAt:communityReplies.createdAt})
    .from(communityReplies)
    .where(eq(communityReplies.userId,userId))
    .orderBy(desc(communityReplies.createdAt)).limit(1)
  if (last && Date.now()-last.createdAt.getTime()<20_000) {
    throw new Error('community_rate_limited')
  }

  const [created]=await db.insert(communityReplies).values({
    threadId,
    parentReplyId:parentReplyId ?? null,
    userId,
    body:normalized.body,
    bodyHtml:normalized.bodyHtml,
    mentions:normalized.mentions,
    status:'pending',
  }).returning({
    id:communityReplies.id,
    status:communityReplies.status,
    parentReplyId:communityReplies.parentReplyId,
  })
  return created
}

export async function setCommunityReaction(
  kind:'thread'|'reply',
  id:string,
  userId:string,
  reaction:CommunityReaction,
) {
  await requireCommunityPostingAccess(userId)

  if (kind==='thread') {
    const [target]=await db.select({id:communityThreads.id}).from(communityThreads)
      .where(and(
        eq(communityThreads.id,id),
        eq(communityThreads.status,'approved'),
        isNull(communityThreads.deletedAt),
      )).limit(1)
    if (!target) throw new Error('community_item_not_found')

    const [existing]=await db.select({
      id:communityThreadLikes.id,
      reaction:communityThreadLikes.reaction,
    }).from(communityThreadLikes)
      .where(and(
        eq(communityThreadLikes.threadId,id),
        eq(communityThreadLikes.userId,userId),
      )).limit(1)

    let nextReaction:CommunityReaction|null=reaction
    if (existing?.reaction===reaction) {
      await db.delete(communityThreadLikes).where(eq(communityThreadLikes.id,existing.id))
      nextReaction=null
    } else if (existing) {
      await db.update(communityThreadLikes)
        .set({reaction})
        .where(eq(communityThreadLikes.id,existing.id))
    } else {
      await db.insert(communityThreadLikes).values({threadId:id,userId,reaction})
    }

    const [row]=await db.select({
      total:count(),
      like:sql<number>`count(*) filter (where ${communityThreadLikes.reaction}='like')::int`,
      love:sql<number>`count(*) filter (where ${communityThreadLikes.reaction}='love')::int`,
      haha:sql<number>`count(*) filter (where ${communityThreadLikes.reaction}='haha')::int`,
      wow:sql<number>`count(*) filter (where ${communityThreadLikes.reaction}='wow')::int`,
      sad:sql<number>`count(*) filter (where ${communityThreadLikes.reaction}='sad')::int`,
    }).from(communityThreadLikes)
      .where(eq(communityThreadLikes.threadId,id))

    return {
      reaction:nextReaction,
      reactionCount:Number(row?.total ?? 0),
      reactionSummary:{
        like:Number(row?.like ?? 0),
        love:Number(row?.love ?? 0),
        haha:Number(row?.haha ?? 0),
        wow:Number(row?.wow ?? 0),
        sad:Number(row?.sad ?? 0),
      } satisfies CommunityReactionSummary,
    }
  }

  const [target]=await db.select({id:communityReplies.id}).from(communityReplies)
    .where(and(
      eq(communityReplies.id,id),
      eq(communityReplies.status,'approved'),
      isNull(communityReplies.deletedAt),
    )).limit(1)
  if (!target) throw new Error('community_item_not_found')

  const [existing]=await db.select({
    id:communityReplyLikes.id,
    reaction:communityReplyLikes.reaction,
  }).from(communityReplyLikes)
    .where(and(
      eq(communityReplyLikes.replyId,id),
      eq(communityReplyLikes.userId,userId),
    )).limit(1)

  let nextReaction:CommunityReaction|null=reaction
  if (existing?.reaction===reaction) {
    await db.delete(communityReplyLikes).where(eq(communityReplyLikes.id,existing.id))
    nextReaction=null
  } else if (existing) {
    await db.update(communityReplyLikes)
      .set({reaction})
      .where(eq(communityReplyLikes.id,existing.id))
  } else {
    await db.insert(communityReplyLikes).values({replyId:id,userId,reaction})
  }

  const [row]=await db.select({
    total:count(),
    like:sql<number>`count(*) filter (where ${communityReplyLikes.reaction}='like')::int`,
    love:sql<number>`count(*) filter (where ${communityReplyLikes.reaction}='love')::int`,
    haha:sql<number>`count(*) filter (where ${communityReplyLikes.reaction}='haha')::int`,
    wow:sql<number>`count(*) filter (where ${communityReplyLikes.reaction}='wow')::int`,
    sad:sql<number>`count(*) filter (where ${communityReplyLikes.reaction}='sad')::int`,
  }).from(communityReplyLikes)
    .where(eq(communityReplyLikes.replyId,id))

  return {
    reaction:nextReaction,
    reactionCount:Number(row?.total ?? 0),
    reactionSummary:{
      like:Number(row?.like ?? 0),
      love:Number(row?.love ?? 0),
      haha:Number(row?.haha ?? 0),
      wow:Number(row?.wow ?? 0),
      sad:Number(row?.sad ?? 0),
    } satisfies CommunityReactionSummary,
  }
}

export type CommunityAdminFilterStatus='all'|'attention'|CommunityStatus

export async function getCommunityTopicsAdmin({
  page=1,
  limit=20,
  status='all',
  q='',
}:{
  page?:number
  limit?:number
  status?:CommunityAdminFilterStatus
  q?:string
}={}) {
  const safeLimit=Math.min(50,Math.max(5,Math.floor(limit)))
  const safePage=Math.max(1,Math.floor(page))
  const term=q.trim().slice(0,120)
  const statusClause=
    status==='all'
      ? sql``
      : status==='attention'
        ? sql`and (
            t.status='pending'
            or exists (
              select 1 from community_replies attention_r
              where attention_r.thread_id=t.id
                and attention_r.deleted_at is null
                and attention_r.status='pending'
            )
          )`
        : sql`and t.status=${status}`
  const searchClause=term
    ? sql`and (
        t.title ilike ${'%'+term+'%'}
        or t.body ilike ${'%'+term+'%'}
        or u.name ilike ${'%'+term+'%'}
        or u.email ilike ${'%'+term+'%'}
      )`
    : sql``

  const countRows=await db.execute(sql`
    select count(*)::int as total
    from community_threads t
    join "user" u on u.id=t.user_id
    where t.deleted_at is null
    ${statusClause}
    ${searchClause}
  `)
  const total=Number((countRows[0] as {total?:number|string}|undefined)?.total ?? 0)
  const pages=Math.max(1,Math.ceil(total/safeLimit))
  const currentPage=Math.min(safePage,pages)
  const offset=(currentPage-1)*safeLimit

  const rows=await db.execute(sql`
    select
      t.id,
      t.title,
      t.body,
      t.status,
      t.pinned,
      t.locked,
      t.created_at as "createdAt",
      t.last_activity_at as "lastActivityAt",
      u.name as "authorName",
      u.email as "authorEmail",
      u.image as "authorImage",
      (
        select count(*)::int
        from community_replies r
        where r.thread_id=t.id and r.deleted_at is null
      ) as "replyCount",
      (
        select count(*)::int
        from community_replies r
        where r.thread_id=t.id and r.deleted_at is null and r.status='pending'
      ) as "pendingReplies",
      (
        select count(*)::int
        from community_thread_likes l
        where l.thread_id=t.id
      ) as "likeCount"
    from community_threads t
    join "user" u on u.id=t.user_id
    where t.deleted_at is null
    ${statusClause}
    ${searchClause}
    order by
      case
        when t.status='pending'
          or exists (
            select 1 from community_replies priority_r
            where priority_r.thread_id=t.id
              and priority_r.deleted_at is null
              and priority_r.status='pending'
          )
        then 0 else 1
      end,
      t.pinned desc,
      t.last_activity_at desc
    limit ${safeLimit}
    offset ${offset}
  `)

  return {
    items:rows as unknown as Array<{
      id:string
      title:string
      body:string
      status:CommunityStatus
      pinned:boolean
      locked:boolean
      createdAt:Date
      lastActivityAt:Date
      authorName:string
      authorEmail:string
      authorImage:string|null
      replyCount:number
      pendingReplies:number
      likeCount:number
    }>,
    total,
    page:currentPage,
    pages,
    limit:safeLimit,
    q:term,
    status,
  }
}

export async function getCommunityTopicAdmin(
  threadId:string,
  {
    page=1,
    limit=20,
    status='all',
    q='',
  }:{
    page?:number
    limit?:number
    status?:CommunityAdminFilterStatus
    q?:string
  }={},
) {
  const [topic]=await db.select({
    id:communityThreads.id,
    title:communityThreads.title,
    body:communityThreads.body,
    bodyHtml:communityThreads.bodyHtml,
    status:communityThreads.status,
    pinned:communityThreads.pinned,
    locked:communityThreads.locked,
    createdAt:communityThreads.createdAt,
    lastActivityAt:communityThreads.lastActivityAt,
    authorName:user.name,
    authorEmail:user.email,
    authorImage:user.image,
    likeCount:sql<number>`(
      select count(*)::int from community_thread_likes l
      where l.thread_id=${communityThreads.id}
    )`,
  })
    .from(communityThreads)
    .innerJoin(user,eq(communityThreads.userId,user.id))
    .where(and(
      eq(communityThreads.id,threadId),
      isNull(communityThreads.deletedAt),
    ))
    .limit(1)
  if (!topic) return null

  const safeLimit=Math.min(50,Math.max(5,Math.floor(limit)))
  const safePage=Math.max(1,Math.floor(page))
  const term=q.trim().slice(0,120)
  const statusClause=
    status==='all'
      ? sql``
      : status==='attention'
        ? sql`and r.status='pending'`
        : sql`and r.status=${status}`
  const searchClause=term
    ? sql`and (
        r.body ilike ${'%'+term+'%'}
        or u.name ilike ${'%'+term+'%'}
        or u.email ilike ${'%'+term+'%'}
      )`
    : sql``

  const countRows=await db.execute(sql`
    select count(*)::int as total
    from community_replies r
    join "user" u on u.id=r.user_id
    where r.thread_id=${threadId}
      and r.deleted_at is null
    ${statusClause}
    ${searchClause}
  `)
  const total=Number((countRows[0] as {total?:number|string}|undefined)?.total ?? 0)
  const pages=Math.max(1,Math.ceil(total/safeLimit))
  const currentPage=Math.min(safePage,pages)
  const offset=(currentPage-1)*safeLimit

  const replies=await db.execute(sql`
    select
      r.id,
      r.parent_reply_id as "parentReplyId",
      r.body,
      r.body_html as "bodyHtml",
      r.status,
      r.created_at as "createdAt",
      u.name as "authorName",
      u.email as "authorEmail",
      u.image as "authorImage",
      (
        select pu.name
        from community_replies pr
        join "user" pu on pu.id=pr.user_id
        where pr.id=r.parent_reply_id
        limit 1
      ) as "parentAuthorName",
      (
        select count(*)::int
        from community_reply_likes l
        where l.reply_id=r.id
      ) as "likeCount"
    from community_replies r
    join "user" u on u.id=r.user_id
    where r.thread_id=${threadId}
      and r.deleted_at is null
    ${statusClause}
    ${searchClause}
    order by
      case when r.status='pending' then 0 else 1 end,
      r.created_at desc
    limit ${safeLimit}
    offset ${offset}
  `)

  return {
    topic,
    replies:replies as unknown as Array<{
      id:string
      parentReplyId:string|null
      body:string
      bodyHtml:string|null
      status:CommunityStatus
      createdAt:Date
      authorName:string
      authorEmail:string
      authorImage:string|null
      parentAuthorName:string|null
      likeCount:number
    }>,
    total,
    page:currentPage,
    pages,
    limit:safeLimit,
    q:term,
    status,
  }
}

export async function setCommunityThreadFlag(
  threadId:string,
  flag:'pinned'|'locked',
  value:boolean,
  moderatorId:string,
) {
  const now=new Date()
  const [row]=await db.update(communityThreads)
    .set(flag==='pinned'
      ? {pinned:value,updatedAt:now}
      : {locked:value,updatedAt:now})
    .where(and(
      eq(communityThreads.id,threadId),
      isNull(communityThreads.deletedAt),
    ))
    .returning({id:communityThreads.id})
  if (!row) throw new Error('community_item_not_found')
  await db.insert(auditLogs).values({
    actorId:moderatorId,
    action:'community.thread.'+flag+'.'+(value?'on':'off'),
    entityType:'community_thread',
    entityId:threadId,
    metadata:{value},
  })
}

export async function getCommunityModerationQueue() {
  const [threads,replies]=await Promise.all([
    db.select({
      kind:sql<'thread'>`'thread'`,
      id:communityThreads.id,
      threadId:communityThreads.id,
      title:communityThreads.title,
      body:communityThreads.body,
      bodyHtml:communityThreads.bodyHtml,
      status:communityThreads.status,
      createdAt:communityThreads.createdAt,
      authorName:user.name,
      authorEmail:user.email,
      authorImage:user.image,
    })
      .from(communityThreads)
      .innerJoin(user,eq(communityThreads.userId,user.id))
      .where(isNull(communityThreads.deletedAt))
      .orderBy(
        sql`case when ${communityThreads.status}='pending' then 0 when ${communityThreads.status}='approved' then 1 else 2 end`,
        desc(communityThreads.createdAt),
      ),
    db.select({
      kind:sql<'reply'>`'reply'`,
      id:communityReplies.id,
      threadId:communityReplies.threadId,
      title:communityThreads.title,
      body:communityReplies.body,
      bodyHtml:communityReplies.bodyHtml,
      status:communityReplies.status,
      createdAt:communityReplies.createdAt,
      authorName:user.name,
      authorEmail:user.email,
      authorImage:user.image,
    })
      .from(communityReplies)
      .innerJoin(communityThreads,eq(communityReplies.threadId,communityThreads.id))
      .innerJoin(user,eq(communityReplies.userId,user.id))
      .where(isNull(communityReplies.deletedAt))
      .orderBy(
        sql`case when ${communityReplies.status}='pending' then 0 when ${communityReplies.status}='approved' then 1 else 2 end`,
        desc(communityReplies.createdAt),
      ),
  ])
  return [...threads,...replies].sort((a,b)=>{
    const rank=(value:string)=>value==='pending'?0:value==='approved'?1:2
    return rank(a.status)-rank(b.status) || b.createdAt.getTime()-a.createdAt.getTime()
  })
}

export async function getCommunityAdminSummary() {
  const [[threads],[replies],[members]]=await Promise.all([
    db.select({
      total:count(),
      pending:sql<number>`count(*) filter (where ${communityThreads.status}='pending')::int`,
    }).from(communityThreads).where(isNull(communityThreads.deletedAt)),
    db.select({
      total:count(),
      pending:sql<number>`count(*) filter (where ${communityReplies.status}='pending')::int`,
    }).from(communityReplies).where(isNull(communityReplies.deletedAt)),
    db.select({
      total:sql<number>`count(distinct ${account.userId})::int`,
    }).from(account).where(eq(account.providerId,'google')),
  ])
  return {
    threads:Number(threads?.total ?? 0),
    replies:Number(replies?.total ?? 0),
    pending:Number(threads?.pending ?? 0)+Number(replies?.pending ?? 0),
    users:Number(members?.total ?? 0),
  }
}

export async function moderateCommunityItem(
  kind:'thread'|'reply',
  id:string,
  status:CommunityStatus,
  moderatorId:string,
) {
  const now=new Date()
  if (kind==='thread') {
    const [row]=await db.update(communityThreads).set({
      status,moderatedBy:moderatorId,moderatedAt:now,updatedAt:now,
    }).where(eq(communityThreads.id,id)).returning()
    if (!row) throw new Error('community_item_not_found')
    await db.insert(auditLogs).values({
      actorId:moderatorId,
      action:'community.thread.'+status,
      entityType:'community_thread',
      entityId:id,
      metadata:{userId:row.userId},
    })
    return row
  }

  const [row]=await db.update(communityReplies).set({
    status,moderatedBy:moderatorId,moderatedAt:now,updatedAt:now,
  }).where(eq(communityReplies.id,id)).returning()
  if (!row) throw new Error('community_item_not_found')
  if (status==='approved') {
    await db.update(communityThreads).set({
      lastActivityAt:sql`greatest(${communityThreads.lastActivityAt}, ${row.createdAt})`,
      updatedAt:now,
    }).where(eq(communityThreads.id,row.threadId))
  }
  await db.insert(auditLogs).values({
    actorId:moderatorId,
    action:'community.reply.'+status,
    entityType:'community_reply',
    entityId:id,
    metadata:{threadId:row.threadId,userId:row.userId},
  })
  return row
}

export async function trashCommunityItem(
  kind:'thread'|'reply',
  id:string,
  moderatorId:string,
) {
  const now=new Date()
  const table=kind==='thread'?communityThreads:communityReplies
  const [row]=await db.update(table).set({
    deletedAt:now,moderatedBy:moderatorId,moderatedAt:now,updatedAt:now,
  }).where(eq(table.id,id)).returning()
  if (!row) throw new Error('community_item_not_found')
  await db.insert(auditLogs).values({
    actorId:moderatorId,
    action:'community.'+kind+'.trash',
    entityType:'community_'+kind,
    entityId:id,
  })
}

export async function getCommunityUsersAdmin() {
  const rows=await db.execute(sql`
    select
      u.id,
      u.name,
      u.email,
      u.image,
      u.email_verified as "emailVerified",
      u.created_at as "createdAt",
      coalesce(cm.status,'active') as status,
      cm.note,
      cm.blocked_at as "blockedAt",
      (select count(*)::int from community_threads t where t.user_id=u.id and t.deleted_at is null) as threads,
      (select count(*)::int from community_replies r where r.user_id=u.id and r.deleted_at is null) as replies
    from "user" u
    left join community_members cm on cm.user_id=u.id
    where exists (
      select 1 from account a where a.user_id=u.id and a.provider_id='google'
    )
    order by u.created_at desc
  `)
  return rows
}

export async function setCommunityMemberStatus(
  userId:string,
  status:CommunityMemberStatus,
  moderatorId:string,
) {
  const blocked=status==='blocked'
  await db.insert(communityMembers).values({
    userId,status,
    blockedBy:blocked?moderatorId:null,
    blockedAt:blocked?new Date():null,
  }).onConflictDoUpdate({
    target:communityMembers.userId,
    set:{
      status,
      blockedBy:blocked?moderatorId:null,
      blockedAt:blocked?new Date():null,
      updatedAt:new Date(),
    },
  })
  await db.insert(auditLogs).values({
    actorId:moderatorId,
    action:blocked?'community.user.block':'community.user.unblock',
    entityType:'community_user',
    entityId:userId,
  })
}
