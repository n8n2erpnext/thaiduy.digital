import { and,count,desc,eq,isNull,sql } from 'drizzle-orm'
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

export type CommunityStatus='pending'|'approved'|'rejected'|'hidden'
export type CommunityMemberStatus='active'|'blocked'

function cleanBody(raw:string,max:number) {
  const body=raw.trim().replace(/\r\n/g,'\n')
  if (body.length < 2 || body.length > max) throw new Error('body_length_invalid')
  return body
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

export async function getPublicCommunityThreads(limit=40) {
  const safeLimit=Math.min(80,Math.max(1,limit))
  return db.select({
    id:communityThreads.id,
    title:communityThreads.title,
    body:communityThreads.body,
    locale:communityThreads.locale,
    createdAt:communityThreads.createdAt,
    lastActivityAt:communityThreads.lastActivityAt,
    authorName:user.name,
    authorImage:user.image,
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
    .where(and(
      eq(communityThreads.status,'approved'),
      isNull(communityThreads.deletedAt),
    ))
    .orderBy(desc(communityThreads.lastActivityAt))
    .limit(safeLimit)
}

export async function getPublicCommunityThread(id:string,userId?:string | null) {
  const threadLiked=userId
    ? sql<boolean>`exists(
        select 1 from community_thread_likes l
        where l.thread_id=${communityThreads.id} and l.user_id=${userId}
      )`
    : sql<boolean>`false`
  const [thread]=await db.select({
    id:communityThreads.id,
    title:communityThreads.title,
    body:communityThreads.body,
    locale:communityThreads.locale,
    createdAt:communityThreads.createdAt,
    lastActivityAt:communityThreads.lastActivityAt,
    authorName:user.name,
    authorImage:user.image,
    likeCount:sql<number>`(
      select count(*)::int from community_thread_likes l
      where l.thread_id=${communityThreads.id}
    )`,
    liked:threadLiked,
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

  const replyLiked=userId
    ? sql<boolean>`exists(
        select 1 from community_reply_likes l
        where l.reply_id=${communityReplies.id} and l.user_id=${userId}
      )`
    : sql<boolean>`false`

  const replies=await db.select({
    id:communityReplies.id,
    body:communityReplies.body,
    createdAt:communityReplies.createdAt,
    authorName:user.name,
    authorImage:user.image,
    likeCount:sql<number>`(
      select count(*)::int from community_reply_likes l
      where l.reply_id=${communityReplies.id}
    )`,
    liked:replyLiked,
  })
    .from(communityReplies)
    .innerJoin(user,eq(communityReplies.userId,user.id))
    .where(and(
      eq(communityReplies.threadId,id),
      eq(communityReplies.status,'approved'),
      isNull(communityReplies.deletedAt),
    ))
    .orderBy(communityReplies.createdAt)
  return {thread,replies}
}

export async function submitCommunityThread(
  userId:string,
  rawTitle:string,
  rawBody:string,
  locale:'en'|'vi',
) {
  await requireCommunityPostingAccess(userId)
  const title=rawTitle.trim().replace(/\s+/g,' ')
  if (title.length < 3 || title.length > 180) throw new Error('title_length_invalid')
  const body=cleanBody(rawBody,5000)

  const [last]=await db.select({createdAt:communityThreads.createdAt})
    .from(communityThreads)
    .where(eq(communityThreads.userId,userId))
    .orderBy(desc(communityThreads.createdAt)).limit(1)
  if (last && Date.now()-last.createdAt.getTime()<60_000) {
    throw new Error('community_rate_limited')
  }
  const [created]=await db.insert(communityThreads).values({
    userId,title,body,locale,status:'pending',
  }).returning({id:communityThreads.id,status:communityThreads.status})
  return created
}

export async function submitCommunityReply(
  threadId:string,
  userId:string,
  rawBody:string,
) {
  await requireCommunityPostingAccess(userId)
  const body=cleanBody(rawBody,3000)
  const [thread]=await db.select({id:communityThreads.id}).from(communityThreads)
    .where(and(
      eq(communityThreads.id,threadId),
      eq(communityThreads.status,'approved'),
      isNull(communityThreads.deletedAt),
    )).limit(1)
  if (!thread) throw new Error('thread_not_found')

  const [last]=await db.select({createdAt:communityReplies.createdAt})
    .from(communityReplies)
    .where(eq(communityReplies.userId,userId))
    .orderBy(desc(communityReplies.createdAt)).limit(1)
  if (last && Date.now()-last.createdAt.getTime()<20_000) {
    throw new Error('community_rate_limited')
  }

  const [created]=await db.insert(communityReplies).values({
    threadId,userId,body,status:'pending',
  }).returning({id:communityReplies.id,status:communityReplies.status})
  return created
}

export async function toggleCommunityLike(
  kind:'thread'|'reply',
  id:string,
  userId:string,
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

    const [existing]=await db.select({id:communityThreadLikes.id}).from(communityThreadLikes)
      .where(and(
        eq(communityThreadLikes.threadId,id),
        eq(communityThreadLikes.userId,userId),
      )).limit(1)

    if (existing) {
      await db.delete(communityThreadLikes).where(eq(communityThreadLikes.id,existing.id))
    } else {
      await db.insert(communityThreadLikes).values({threadId:id,userId})
    }

    const [row]=await db.select({value:count()}).from(communityThreadLikes)
      .where(eq(communityThreadLikes.threadId,id))
    return {liked:!existing,likeCount:Number(row?.value ?? 0)}
  }

  const [target]=await db.select({id:communityReplies.id}).from(communityReplies)
    .where(and(
      eq(communityReplies.id,id),
      eq(communityReplies.status,'approved'),
      isNull(communityReplies.deletedAt),
    )).limit(1)
  if (!target) throw new Error('community_item_not_found')

  const [existing]=await db.select({id:communityReplyLikes.id}).from(communityReplyLikes)
    .where(and(
      eq(communityReplyLikes.replyId,id),
      eq(communityReplyLikes.userId,userId),
    )).limit(1)

  if (existing) {
    await db.delete(communityReplyLikes).where(eq(communityReplyLikes.id,existing.id))
  } else {
    await db.insert(communityReplyLikes).values({replyId:id,userId})
  }

  const [row]=await db.select({value:count()}).from(communityReplyLikes)
    .where(eq(communityReplyLikes.replyId,id))
  return {liked:!existing,likeCount:Number(row?.value ?? 0)}
}

export async function getCommunityModerationQueue() {
  const [threads,replies]=await Promise.all([
    db.select({
      kind:sql<'thread'>`'thread'`,
      id:communityThreads.id,
      threadId:communityThreads.id,
      title:communityThreads.title,
      body:communityThreads.body,
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
