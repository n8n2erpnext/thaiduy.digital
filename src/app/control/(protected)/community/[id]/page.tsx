import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCommunityTopicAdmin,
  type CommunityAdminFilterStatus,
} from '@/community/data'
import {
  moderateCommunityAction,
  setCommunityThreadFlagAction,
  trashCommunityAction,
} from '../actions'

type Props={
  params:Promise<{id:string}>
  searchParams:Promise<{
    page?:string
    status?:string
    q?:string
  }>
}

const statuses:CommunityAdminFilterStatus[]=[
  'all','pending','approved','hidden','rejected',
]

function pageNumber(value:string|undefined) {
  const parsed=Number.parseInt(value ?? '1',10)
  return Number.isFinite(parsed) && parsed>0?parsed:1
}

function statusValue(value:string|undefined):CommunityAdminFilterStatus {
  return statuses.includes(value as CommunityAdminFilterStatus)
    ? value as CommunityAdminFilterStatus
    : 'all'
}

function repliesHref(
  id:string,
  {
    page,status,q,
  }:{
    page:number
    status:CommunityAdminFilterStatus
    q:string
  },
) {
  const params=new URLSearchParams()
  if (page>1) params.set('page',String(page))
  if (status!=='all') params.set('status',status)
  if (q) params.set('q',q)
  const query=params.toString()
  return '/control/community/'+id+(query?'?'+query:'')
}

function ModerationActions({
  kind,id,threadId,status,
}:{
  kind:'thread'|'reply'
  id:string
  threadId:string
  status:string
}) {
  return (
    <div className="control-actions discuss-item-actions">
      {status!=='approved' && (
        <form action={moderateCommunityAction}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="threadId" value={threadId} />
          <input type="hidden" name="status" value="approved" />
          <button type="submit">APPROVE</button>
        </form>
      )}
      {status!=='rejected' && (
        <form action={moderateCommunityAction}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="threadId" value={threadId} />
          <input type="hidden" name="status" value="rejected" />
          <button type="submit">REJECT</button>
        </form>
      )}
      {status!=='hidden' && (
        <form action={moderateCommunityAction}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="threadId" value={threadId} />
          <input type="hidden" name="status" value="hidden" />
          <button type="submit">HIDE</button>
        </form>
      )}
      <form action={trashCommunityAction}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="threadId" value={threadId} />
        <button className="is-danger" type="submit">TRASH</button>
      </form>
    </div>
  )
}
export default async function DiscussTopicControlPage({params,searchParams}:Props) {
  const {id}=await params
  const raw=await searchParams
  const page=pageNumber(raw.page)
  const status=statusValue(raw.status)
  const q=(raw.q ?? '').trim().slice(0,120)

  const data=await getCommunityTopicAdmin(id,{page,limit:20,status,q})
  if (!data) notFound()

  const topic=data.topic

  return (
    <section className="control-page discuss-topic-control-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTROL / DISCUSS / TOPIC</p>
          <h1>{topic.title}</h1>
          <span>Manage the topic and its replies without mixing unrelated conversations.</span>
        </div>
        <div className="discuss-control-head-actions">
          <Link className="control-back" href="/control/community">← TOPICS</Link>
          <Link className="control-back" href={'/discuss/'+topic.id} target="_blank">PUBLIC ↗</Link>
        </div>
      </header>

      <article className="discuss-control-topic-card">
        <div className="community-admin-author">
          {topic.authorImage
            ? <img src={topic.authorImage} alt="" />
            : <i>{topic.authorName.slice(0,2).toUpperCase()}</i>}
          <div>
            <strong>{topic.authorName}</strong>
            <small>{topic.authorEmail}</small>
          </div>
        </div>

        <div className="discuss-control-topic-body">
          <header>
            <span className={'control-state is-'+topic.status}>{topic.status.toUpperCase()}</span>
            {topic.pinned && <span className="discuss-control-chip is-signal">PINNED</span>}
            {topic.locked && <span className="discuss-control-chip">LOCKED</span>}
            <time>{topic.createdAt.toLocaleString('en-GB')}</time>
          </header>
          {topic.bodyHtml ? (
            <div
              className="community-admin-rich-preview discuss-post-body"
              dangerouslySetInnerHTML={{__html:topic.bodyHtml}}
            />
          ) : (
            <p>{topic.body}</p>
          )}
          <footer>
            <span>{Number(topic.likeCount)} LIKES</span>
            <span>ACTIVE {topic.lastActivityAt.toLocaleString('en-GB')}</span>
          </footer>
        </div>

        <div className="discuss-control-topic-tools">
          <ModerationActions
            kind="thread"
            id={topic.id}
            threadId={topic.id}
            status={topic.status}
          />
          <div className="discuss-thread-flags">
            <form action={setCommunityThreadFlagAction}>
              <input type="hidden" name="threadId" value={topic.id} />
              <input type="hidden" name="flag" value="pinned" />
              <input type="hidden" name="value" value={String(!topic.pinned)} />
              <button type="submit">{topic.pinned?'UNPIN':'PIN'}</button>
            </form>
            <form action={setCommunityThreadFlagAction}>
              <input type="hidden" name="threadId" value={topic.id} />
              <input type="hidden" name="flag" value="locked" />
              <input type="hidden" name="value" value={String(!topic.locked)} />
              <button type="submit">{topic.locked?'UNLOCK':'LOCK'}</button>
            </form>
          </div>
        </div>
      </article>
      <section className="discuss-replies-admin">
        <header>
          <div>
            <span>REPLIES</span>
            <strong>{data.total.toLocaleString('en-US')}</strong>
          </div>
          <form className="discuss-control-filter is-compact" method="get">
            <label>
              <span>SEARCH</span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Reply, author or email…"
                maxLength={120}
              />
            </label>
            <label>
              <span>STATUS</span>
              <select name="status" defaultValue={status}>
                <option value="all">ALL</option>
                <option value="pending">PENDING</option>
                <option value="approved">APPROVED</option>
                <option value="hidden">HIDDEN</option>
                <option value="rejected">REJECTED</option>
              </select>
            </label>
            <button type="submit">APPLY</button>
            {(q || status!=='all') && <Link href={'/control/community/'+topic.id}>CLEAR</Link>}
          </form>
        </header>

        <div className="community-admin-list discuss-reply-admin-list">
          {data.replies.length===0 && (
            <div className="cms-empty-state">
              <strong>No matching replies.</strong>
              <p>This topic has no replies for the current search/status filter.</p>
            </div>
          )}

          {data.replies.map(reply=>(
            <article className="community-admin-row" data-status={reply.status} key={reply.id}>
              <div className="community-admin-author">
                {reply.authorImage
                  ? <img src={reply.authorImage} alt="" />
                  : <i>{reply.authorName.slice(0,2).toUpperCase()}</i>}
                <div>
                  <strong>{reply.authorName}</strong>
                  <small>{reply.authorEmail}</small>
                </div>
              </div>

              <div className="community-admin-content">
                <header>
                  <span className={'control-state is-'+reply.status}>{reply.status.toUpperCase()}</span>
                  {reply.parentAuthorName && <b>↪ @{reply.parentAuthorName}</b>}
                  <time>{reply.createdAt.toLocaleString('en-GB')}</time>
                </header>
                {reply.bodyHtml ? (
                  <div
                    className="community-admin-rich-preview discuss-post-body"
                    dangerouslySetInnerHTML={{__html:reply.bodyHtml}}
                  />
                ) : (
                  <p>{reply.body}</p>
                )}
                <small className="discuss-control-reply-meta">{Number(reply.likeCount)} LIKES</small>
              </div>

              <ModerationActions
                kind="reply"
                id={reply.id}
                threadId={topic.id}
                status={reply.status}
              />
            </article>
          ))}
        </div>
        {data.pages>1 && (
          <nav className="control-hot-pagination discuss-control-pagination" aria-label="Reply pagination">
            <Link
              href={repliesHref(topic.id,{
                page:Math.max(1,data.page-1),status,q,
              })}
              data-disabled={data.page===1 || undefined}
              aria-disabled={data.page===1}
            >
              ← PREV
            </Link>
            <span>PAGE {data.page} / {data.pages}</span>
            <Link
              href={repliesHref(topic.id,{
                page:Math.min(data.pages,data.page+1),status,q,
              })}
              data-disabled={data.page===data.pages || undefined}
              aria-disabled={data.page===data.pages}
            >
              NEXT →
            </Link>
          </nav>
        )}
      </section>
    </section>
  )
}
